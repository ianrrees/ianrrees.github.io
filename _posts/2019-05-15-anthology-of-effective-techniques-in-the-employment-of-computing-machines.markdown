---
layout: post
title: "Anthology of Effective Techniques in the Employment of Computing Machines"
categories:
---

Here are some computer things that I've found handy, in case they're helpful to you, or future-me:

Don't forget pipes
===
At work, I often need to deal with rather verbose logs that originate on developement hardware and get to my computer via serial ports. Lately, I use `tio` to receive the logs initially, then I either scan through the logs by eye or move them in to a text editor. 

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
  * [tio](https://github.com/tio/tio) is the tool to use for working with serial consoles/logging/etc - has completely replaced `screen`, `minicom`, etc in my regular usage
  * `tmux` More below
  * [bottom](https://github.com/ClementTsang/bottom) A cool update of the classic `top`

Shell variables and aliases
===

In my home directory, I have a directory for work stuff.  Often, I want to just cd in to a subdirectory of that - for instance in to the one that most of my git repos live under.  `CDPATH` lets me just type `cd git/project` and get `~/Work/git/project`.  The first entry in CDPATH is `.` to avoid aliasing problems, like if your current directory is `someproject` and both it and `~/Work` contain a `temp` directory, you want `cd temp` to go in to `someproject/temp` not `~/Work/temp/`:

```
export CDPATH=.:/home/irees/Work:$CDPATH
```

Here's one of my favourites aliases - a simple function that makes a directory then changes in to it.  The `./` is subtle belt-and-braces in addition to the above note - it's to cover the case when there is a directory in the `CDPATH` environment that has the same name as the directory that `mkcd` is making:
```
function mkcd {
    mkdir "$1" && cd ./"$1"
}
```

git stuff
===

#### Aliases
If you frequently use git from the command line, git's alias feature may be helpful.
For instance, in my ~/.gitconfig, I have:

```
[alias]
        cof = !git for-each-ref --format='%(refname:short)' refs/heads | fzf | xargs git checkout
        newbranch = !git checkout -b $(date +"%Y%m%d")-$1 && :
```

`git cof` launches a nice fzf-powered branch picker, then checks out the selected branch (from a [HN comment](https://news.ycombinator.com/item?id=20361377)).

`git newbranch my-branch` makes a new branch, prepended with today's date in the form YYYYMMDD. The trailing `&& :` is the secret sauce here; without it the alias would expand to `git checkout -b YYYYMMDD-my-branch my-branch`, which fails because my-branch doesn't yet exist in the git repo.

#### Distinct configurations by repo path
I use git for both personal and work projects, but don't want to mix my personal and work email addresses between those.
The [conditional includes](https://git-scm.com/docs/git-config#_conditional_includes) feature in git configuration allows for overriding the email setting for any repos stored under ~/Company, leaving the personal address for the rest.

In ~/.gitconfig:

```
[user]
    name = My Name
    email = my.name@personal.com

[includeIf "gitdir:~/Company/"]
    path = .gitconfig-work

```

And a 2-line ~/.gitconfig-work:

```
[user]
    email = my.name@company.com
```

tmux stuff
===
I started using tmux as an upgraded version of `screen`, for running commands that I want to put in the background (my work VPN client) and for SSH sessions that should persist even if the connection fails, but have gradually used this more and more to replace having multiple terminal windows in my GUI.  At this stage, the fact that tmux makes sessions persistent is just an occasionally-helpful side effect in most cases, it's really more of a window manager for the stuff I do in a terminal.  My normal arrangement has two terminals - one for each monitor - and have [tmuxp](https://github.com/tmux-python/tmuxp) configurations to set up a number of windows in each of them, for stuff like chat (weechat), system status (bottom), separate windows for the work projects I've got on the go, etc.  Depending on what I'm working on, I'll also have a terminal opened up in my text editor (codium) with a tmux session running in it.

Rename session: Ctrl+b + $
Session picker: Ctrl+b + s

Safer shell command substitution
===

A quick one I figured out for use with [ttynamed](https://github.com/ianrrees/ttynamed): if you're in the habit of using the classic ```$ some_command `other_command` ```, or the safer `$ some_command "$(other_command)"`, there could be problems if `other_command` fails without writing anything to stdout, causing `some_command` to run without an argument. To prevent `some_command` from running when `other_command` fails, use a construct like:

```
$ temp=$(other_command) && some_command $temp
```

Other resources
===

[The Lost Art of Structure Packing](http://www.catb.org/esr/structure-packing/) is a very nicely done page on C structures.