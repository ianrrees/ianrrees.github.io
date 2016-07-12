---
layout: post
title: "Cross compiling for BeagleBone from MacOS"
categories:
---

Getting started with compiling code for the BeagleBone is super easy.
For instance, with my new BeagleBone Green Wireless (currently running Debian 8.4, kernel 4.4.9-ti-r25), and I presume other models too, the steps are something like:

  1. Plug in USB to computer, wait for heartbeat pattern on BB's LEDs.
  2. Enter `$screen /dev/cu.usbmodemNNNN` in computer's terminal.
  3. Login to BB - default user name and password are displayed.
  4. Create a test program with your favourite editor, compile with gcc, run your test program.

For example:

    $vi test.c

```C
#include<stdio.h>

int main(int argc, char **argv)
{
    printf("Woof!\n");
    return 0;
}
```

    $gcc -Wall -o test test.c
    $./test
    Woof!
    $

That said, I'm curious about building some reasonably burly programs to run on the BB; for example I'd like to try using [OpenCV](http://opencv.org/) for a robot vacuum racer, and I imagine will need to build Linux kernels (or at least modules?) to take advantage of the two [PRU](http://processors.wiki.ti.com/index.php/PRU-ICSS) coprocessors.

Rather than building these bigger pieces of software on the little BB, we'll set up the big computer (running MacOS 10.11.5, Xcode 7.3.1, and [Homebrew](http://brew.sh) package manager) as a host for a cross-compiling environment.  There are likely a number of ways to do this, I'll be using [crosstool-ng](http://crosstool-ng.org/) version 1.22.

Crosstool-ng requires a few items that don't come with a standard MacOS environment; mainly some of the gcc tools, and we'll need a case-sensitive filesystem.
Annoyingly, MacOS ships with the case sensitivity turned off, and as I once found out there is some stupid software out there (looking at you, Adobe) that doesn't work on a case sensitive volume...

Anyways, first take care of the Homebrew bits:

    $brew install coreutils ( https://github.com/Homebrew/homebrew-core/pull/2892 )
    $brew tap homebrew/dupes
    $brew install homebrew/dupes/grep homebrew/dupes/make
    $brew install crosstool-ng
    
Then, we need to create and mount a case sensitive sparse volume.
I used 10GB as a starting size and found a typical build takes something like 6.5GB in the end, but possibly more during build.
Unfortunately, there's currently a [bug](https://discussions.apple.com/thread/7395900) in the new Disk Utility that comes with MacOS 10.11, so either make the volume via command line (`$info hdiutil`), or use the Disk Utility to _re_ format the volume you just created as case-sensitive...

Once you're past that hurdle, cd in to the mounted volume (eg `$cd /Volumes/ct-beaglebone` ), then setup crosstools:

    $ulimit -n 2048
    $ct-ng arm-cortex_a8-linux-gnueabi
    $ct-ng menuconfig
    
There are a plethora of options available in here, and I won't pretend for a second to have figured out all of them.  The required changes that I'm aware of are:

  * Paths and misc options
    * Change all the paths to be below the new volume you've created.  Eg I have local tarballs directory set to /Volumes/ct-beaglebone/src .  The issue here is that crosstools needs these directories to exist, be case-senstive, etc.
    * Deselect "Render the toolchain read-only"
    * Set Number of parallel jobs to something like the number of cores in your host system (except if you're having problems building crosstool-ng, in which case it should be left at 0 to get more legible logs and error messages).
    * Add `-fbracket-depth=1024 -fno-unroll-loops` in Extra host compiler flags.
  * Target options
    * `neon` in the Use specific FPU option
    * Select hardware floating point
  * Binary Utilities
    * Change "Linkers to Enable", to only enable ld.
  * Debug facilities
    * Turn off dmalloc and strace

Then, there are a couple manual configuration changes that need to be made outside of menuconfig:

  * Ensure that the path to the local tarballs directory exists and is writeable
  * Manually edit the .config file created by menuconfig to change CT\_WANTS\_STATIC\_LINK and CT\_CC\_GCC\_STATIC\_LIBSTDCXX both to 'n'

Once everything is configured, start the build and go have a beer or whatever - it'll take a while.

    $ct-ng build

I think it's safe to disregard these two warnings that sat at the end of the output for an uncomfortable amount of time on my system:

    [ERROR]    clang: error: unsupported option '-print-multi-os-directory'
    [ERROR]    clang: error: no input files

Assuming the build finishes OK, you should be able to build a simple test program on the host computer, and run it on the beaglebone.  For example, using the same test.c as above, do this on the host computer:

    $export PATH=/Volumes/ct-beaglebone/x-tools/arm-cortex_a8-linux-gnueabihf/bin/:$PATH
    $arm-cortex_a8-linux-gnueabihf-gcc -Wall -o test test.c
    $./test
    -bash: ./test: cannot execute binary file

Copy `test` over to the beaglebone though, and you should see:

    $./test
    Woof!
