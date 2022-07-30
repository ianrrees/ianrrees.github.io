---
layout: post
title: "Stopping Rust Threads"
categories:
---

Recently, I discovered that a pattern I've been using for worker threads in Rust
has a flaw: it doesn't guarantee that objects in the thread get dropped
properly.  First, the bad old way - a more realistic example would usually send
data through the `channel`:

[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=0763cd2b51d93f4a36d2ce9d467fe4c1)
``` Rust
use std::sync::mpsc::{channel, Sender, TryRecvError};
use std::thread::{sleep, spawn};
use std::time::{Duration, Instant};

fn main() {
    println!("Main running.");

    let worker = spawn_worker();
    sleep(Duration::from_secs(3));

    println!("Stopping worker.");
    drop(worker);

    println!("Main exiting.");
}

fn spawn_worker() -> Sender<()> {
    let (sender, receiver) = channel();

    spawn(move || {
        let mut last_update = Instant::now() - Duration::from_secs(2);

        loop {
            match receiver.try_recv() {
                Ok(()) | Err(TryRecvError::Empty) => {
                    // Channel is open, keep working
                }
                Err(TryRecvError::Disconnected) => {
                    // Channel is closed, it's time to stop working
                    break;
                }
            }

            // Normally, this would be the place to do some work, but in this
            // contrived example, we'll just print to the terminal
            let now = Instant::now();
            if now - last_update > Duration::from_secs(1) {
                println!("Doing some work...");
                last_update = now;
            }
        }

        println!("Worker exiting.");
    }); // <Ominous voice> we drop the JoinHandle

    sender
}
```

This contrived example will generate output something like below...:

```
Main running.
Doing some work...
Doing some work...
Doing some work...
Stopping worker.
Main exiting.
Worker exiting.
```
...at least, most of the time it will.

Sometimes `Worker exiting.` doesn't show up in the output, and that's a problem!
Of course, in the real world, that `println!("Worker exiting.");` would only be
added by someone looking for a problem, which means this is a sneaky pattern
indeed.

Why is it a problem to not see `Worker exiting.` in the output?  In short,
because we usually expect that destructors will be called, and this is showing a
situation where destructors for variables in the thread might not be called.
Resources like dynamic memory, file handles, lock files, etc are often released
by destructors. If that worker thread above allocated memory, for instance by
using `Vec<>` or `Box<>`, it would sometimes leak memory.  Of course, in normal
computers, the Operating System will usually clean up after the whole process
shuts down, so memory leaks like this might not be a problem in practice.  But
the OS in an embedded system may not be so sophisticated, and there are still
plenty other issues than memory leaks.

The following example makes two changes: it provides a clearer demonstration of
the problem, and it includes a simple solution.  It introduces a `struct
StructuredFile` which creates a file that is always supposed to end with a
particular line, but usually that line won't be present in the created file
until the solution is in place.  The solution is straightfoward enough: just
wait on the worker thread to finish by calling `join()`, before exiting
`main()`.  See the comment in `main()`:

[Rust Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=b620c065b09f8b24c8372866eef54a4b)
``` Rust
use std::fs::File;
use std::io::Write;
use std::sync::mpsc::{channel, Sender, TryRecvError};
use std::thread::{sleep, spawn, JoinHandle};
use std::time::Duration;

fn main() {
    println!("Main running.");

    let worker = spawn_worker();
    sleep(Duration::from_secs(3));

    println!("Stopping worker.");

    // The problematic old way drops both the sender, which causes the worker to
    // exit, /and/ it drops the JoinHandle.  Dropping the JoinHandle "detaches"
    // the worker thread, which means the main thread has no way to know when
    // the worker thread has finished.
    drop(worker);

    // // Instead, drop the sender to signal the thread to stop...
    // let (sender, handle) = worker;
    // drop(sender);
    // // ...and wait until the thread is done!
    // handle.join().expect("Worker thread didn't exit cleanly");

    println!("Main exiting.");
}

/// Manages a file with a structured format
/// 
/// Still a bit of a toy example; this is meant to create a file that looks like
/// this - there will be one `Doing some work` line for each call to `work()`:
/// 
/// ```
/// Beginning of structured file
///     Doing some work...
///     Doing some work...
/// End of structured file
/// ```
struct StructuredFile {
    inner: File,
}

impl StructuredFile {
    pub fn new(name: &str) -> Self {
        let mut inner = File::create(name).expect("Failed to create file");
        inner
            .write_all(b"Beginning of structured file\n")
            .expect("Failed to write to file");
        Self { inner }
    }

    pub fn work(&mut self) {
        self.inner
            .write_all(b"\tDoing some work...\n")
            .expect("Failed to write to file");
        sleep(Duration::from_secs(1));
    }
}

impl Drop for StructuredFile {
    fn drop(&mut self) {
        self.inner
            .write_all(b"End of structured file\n")
            .expect("Failed to write to file");
    }
}

fn spawn_worker() -> (Sender<()>, JoinHandle<()>) {
    let (sender, receiver) = channel();

    let handle = spawn(move || {
        let mut file = StructuredFile::new("a.file");

        loop {
            match receiver.try_recv() {
                Ok(()) | Err(TryRecvError::Empty) => {
                    // Channel is open, keep working
                }
                Err(TryRecvError::Disconnected) => {
                    // Channel is closed, it's time to stop working
                    break;
                }
            }

            // Now, we're calling a method that takes a bit of time to run. If
            // we just drop the Sender and JoinHandle, `drop()` will just about
            // never be called on `file`.
            file.work();
        }

        println!("Worker exiting.");
    });

    (sender, handle)
}

```