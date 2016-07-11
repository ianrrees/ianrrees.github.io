---
layout: post
title: "Cross compiling for BeagleBone from MacOS"
categories:
---

Getting started programming on the BeagleBone is super easy.  For instance, with my new BeagleBone Green Wireless (and I presume other models), the steps are something like:

  1. Plug in USB to computer, wait for heartbeat pattern on BB's LEDs.
  2. Open terminal on computer.
  3. $screen /dev/cu.usbmodem1234
  4. Login to BB (default user name and password are displayed on first boot)
  5. Just like any typical unixy platform: create a test program with your favourite editor, compile with gcc, run your test program.

For example:

    $vi test.c
      #include<stdio.h>

      int main(int argc, char **argv)
      {
          printf("Hello world!\n");
          return 0;
      }
    $gcc -Wall -o test test.c
    $./test
    Hello world!
    $

That said, I'm curious about building some reasonably burly programs to run on the BB; for example I'd like to try using [OpenCV](http://opencv.org/) for a robot vacuum racer, and I imagine will need to build Linux kernels (or at least modules?) to take advantage of the [PRU](http://processors.wiki.ti.com/index.php/PRU-ICSS)s.

So, rather than building these bigger pieces of software on the little BB, we'll setup the big computer (running MacOS 10.11 currently, with the [Homebrew](http://brew.sh) package manager) as a host for a cross-compiling environment.  There are likely a number of ways to do this, I'll be using crosstools-ng.

Crosstools requires a few things that don't come with a standard MacOS environment, mainly some of the gcc tools, and we'll need a case-sensitive filesystem.  Annoyingly, MacOS ships with the case sensitivity turned off, and as I once found out there is some stupid software out there (looking at you, Adobe) that doesn't work on a case sensitive volume...

Anyways, first take care of the Homebrew bits:

    $brew install coreutils (I'm planning on submitting a PR to make this a regular dependency of crosstool-ng)
    $brew tap homebrew/dupes
    $brew install homebrew/dupes/grep homebrew/dupes/make
    $brew install crosstool-ng
    
Then, we need to create and mount a case sensitive sparse volume, I used 10GB as a starting size.  Unfortunately, there's currently a [bug](https://discussions.apple.com/thread/7395900) in the "new" Disk Utility, so either make the volume via command line (hdiutil), or use the Disk Utility to _re_format the volume you just created as case-sensitive...

Once you're past that hurdle, cd in to the mounted volume, then setup crosstools:

    $ulimit -n 2048
    $ct-ng arm-cortex_a8-linux-gnueabi
    $ct-ng menuconfig
    
There are a plethora of options available in here, and I won't pretend for a second to have figured out all of them.  The required changes that I'm aware of are:

  * Paths and misc options
    * Change all the paths to be below the new volume you've created.  Eg I have local tarballs directory set to /Volumes/ct-beaglebone/src .  The issue here is that crosstools needs these directories to exist, be case-senstive, etc.
    * Add -fbracket-depth=1024 in "Extra host compiler flags".
  * Binary Utilities
    * Change "Linkers to Enable", to only enable ld.

Then, there are a couple manual configuration changes that need to be made outside of menuconfig:
  * Ensure that the path to the local tarballs directory exists and is writeable
  * Manually edit the .config file created by menuconfig to change CT\_WANTS\_STATIC\_LINK and CT\_CC\_GCC\_STATIC\_LIBSTDCXX both to 'n'

