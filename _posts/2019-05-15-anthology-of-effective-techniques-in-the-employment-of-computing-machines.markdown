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
  * `rg` [Ripgrep](https://github.com/BurntSushi/ripgrep) is a great upgrade from grep, not least because it's much faster when searching over lots of files.
  * `tmux` I mainly use as an upgraded version of `screen`, for running commands that I want to put in the background (my work VPN client) and for SSH sessions that should persist even if the connection fails.

Shell aliases
===
In my home directory is a subdirectory called Company, where I keep files for the work I do for Company; this gives a `cd` workalike, relative to that:
```
function ccd {
    cd "$HOME/Company/$1"
}
```

Here's one of my favourites - a simple function that makes a directory then changes in to it:
```
function mkcd {
    mkdir "$1" && cd "$1"
}
```

Git aliases
===
If you frequently use git from the command line, you might find git's alias feature helpful.  In my ~/.gitconfig, I have:

```
[alias]
        cof = !git for-each-ref --format='%(refname:short)' refs/heads | fzf | xargs git checkout
        newbranch = !git checkout -b $(date +"%Y%m%d")-$1 && :
```

`git cof` launches a nice fzf-powered branch picker, then checks out the selected branch (from a [HN comment](https://news.ycombinator.com/item?id=20361377)).

`git newbranch my-branch` makes a new branch, prepended with today's date in the form YYYYMMDD. The trailing `&& :` is the secret sauce here; without it the alias would expand to `git checkout -b YYYYMMDD-my-branch my-branch`, which fails because my-branch doesn't yet exist in the git repo.

Safer shell command substitution
===

A quick one I figured out for use with [ttynamed](https://github.com/ianrrees/ttynamed): if you're in the habit of using the classic ```$ some_command `other_command` ```, or the safer `$ some_command "$(other_command)"`, there could be problems if `other_command` fails without writing anything to stdout, causing `some_command` to run without an argument. To prevent `some_command` from running when `other_command` fails, use a construct like:

```
$ temp=$(other_command) && some_command $temp
```

Other resources
===

[The Lost Art of Structure Packing](http://www.catb.org/esr/structure-packing/) is a very nicely done page on C structures.