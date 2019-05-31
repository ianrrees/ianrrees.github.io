---
layout: post
title: "Anthology of Effective Techniques in the Employment of Computing Machines"
categories:
---

Here are some computer things that I've found handy, in case they're helpful to you, or future-me:

Don't forget pipes
===
At work, I often need to deal with rather verbose logs that originate on developement hardware and get to my computer via serial ports. Lately, I use `screen` (one of the the more irritatingly named programs I've encountered) to receive the logs initially, then I either scan through the logs by eye or move them in to a text editor. 

Sometimes though, I'm only looking for a particular type of message. For instance, a device I'm working on today periodically outputs the state of a state machine that I'm interested in, via a line that starts with "STATE", but that is mixed in with tons of distracting irrelevant information. In this situation, it can be handy to pipe the output from the device through `grep` (or, more recently, [ripgrep](https://github.com/BurntSushi/ripgrep)), so only lines starting with STATE are displayed. Something like this on one terminal: `$ cat /dev/ttyUSB3 | tee full_log.txt | grep '^STATE'`, then optionally in a different terminal: `$ tail -f full_log.txt`. This captures the entire log to a file, and gives real-ish time output of both the complete log, and the lines that start with STATE.

Infinite command line history
===
I've found it handy to configure bash's command history to be infinitely long; in conjunction with the history search offered by mapping `fzf` to `Ctrl+r`, this helps compensate for my lousy memory. Unfortunately, it's not quite as straightforward as one might hope; see [the answer by fotinakis](https://stackoverflow.com/a/19533853/10328027) for a more thorough explanation.

Basically, you want `HISTSIZE=` and `HISTFILESIZE=` in your `.bashrc` (any other setting of those to be removed, including in the same file), and set your `HISTFILE=~/.bash_eternal_history` or similar non-default name. Otherwise, some scenarios can result in your long history being unintentionally nuked.

Handy, and perhaps not obvious, command line tools
===
#### Commonly bundled with *NIX-style operating systems

  * `watch` runs the specified command over and over again, updating the output on the screen as it does.

#### Might need to be installed separately

  * `fzf` Fuzzy search for your shell; makes the command line history search from `Ctrl+r` particularly nice.
  * `tmux` I mainly use as an upgraded version of `screen`, for running commands that I want to put in the background (my work VPN client) and for SSH sessions that should persist even if the connection fails.