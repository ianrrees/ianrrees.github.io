---
layout: post
title: "Getting started with ATSAMD21 development on MacOS"
categories:
---

As often happens, a relatively simple task has turned in to a complicated task.
This morning, I set out to finish off the design of the [VCW scoreboard](http://ianrrees.github.io/2017/04/07/scoreboard.html)'s circuit board, which "just" involved shuffling some of the uses of the pins on the ATSAMD10C microcontroller...

To finish that, I needed to know if it's OK to hook other stuff on to the SWCLK line - specifically a "heartbeat" LED that I tend to add to designs with microcontrollers in them (it's nice to be able to see if the CPU is ticking over).
I have an Adafruit Feather M0 Express, which uses a similar ATSAMD21G microcontroller, so I figured the best thing to do was try a similar circuit with it!

But, I'm using the scoreboard project as a sort of test case for hobby projects with little ARM chips - this would be my first foray in to SWD.
Using my Bus Blaster v4 for SWD required changing its "buffer logic", which was a little bit of a mission in and of itself - mainly in finding the actual buffer logic file.
Then, to really test the SWD, one needs an image or two to load...

## General requirements
Starting from the "high level", we need:

  1. ASF library
  2. gcc and friends, built to target Cortex M0+
  3. A program to load, compiled by #2
  4. OpenOCD configuration files appropriate for the Bus Blaster v4 with the SWD logic, and your board
  5. Bus Blaster v4 with the KT-link "Buffer Logic" loaded so it supports SWD
  6. SWD and power connections to the microcontroller

### ASF

ASF used to be the "Atmel Software Framework", but since Microchip bought Atmel it has been renamed to "Advanced Software Framework".
ASF is a library for working with Atmel, now Microchip, parts - it has code for everything from toggling GPIO pins up through ethernet or USB host with parts that support those things.
While it's possible to build code for the Atmel ARM chips completely without the ASF, that's an uphill battle that probably isn't worth fighting.

ASF is generally (at least in my limited experience working with it) only compiled with some parts of the library included, for a particular project.
Typically a configuration tool is used to pick out the relevant parts of the ASF, which can be a bit of a pain if ASF requirements change as the project evolves.

There are currently two active versions of the ASF - v3 and v4, with the newer one being a re-write to reduce code size and increase speed.
ASF v3 can be downloaded as a stand-alone zip, but more-or-less requires Atmel Studio for configuration.
As far as IDEs are concerned, Atmel Studio isn't a bad one, but it only runs on Windows.

ASF v4 on the other hand, has an interesting web-based front end, [start.atmel.com](http://start.atmel.com), which can generate a tree of source, including Makefiles!
START provides a fairly straightforward web interface to setup a project for particular processors, with particular drivers, and allows you to download a configured project for several different environments including "Makefile".

Use START to setup a basic project for your microprocessor with no additional "software components", download the Makefile project, and unzip (for some reason they name the file with .atzip - it's a regular zip file) it in to an empty directory.

The appropriate Makefile will be in the gcc subdirectory, but at the time of writing it won't work with MacOS out of the box.
Near the top of the file, duplicate these three lines, but change "Linux" to "Darwin":

```
	ifeq ($(shell uname), Linux)
		MK_DIR = mkdir -p
	endif
```

### C compiler

I've toyed with building a custom gcc for ARM M0+ using [crosstool-NG](http://crosstool-ng.github.io/), but have had some problems building newlib for that target.
So, we'll take the easy road and use [Homebrew](https://brew.sh/)!

```
$ brew tap osx-cross/arm
$ brew install arm-gcc-bin
```

When this is done, you'll have a gcc and friends available as arm-none-eabi-gcc, which can target the ARM M0+:

```
$ arm-none-eabi-gcc --version
arm-none-eabi-gcc (GNU Tools for ARM Embedded Processors 6-2017-q1-update) 6.3.1 20170215 (release) [ARM/embedded-6-branch revision 245512]
Copyright (C) 2016 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

### Hello World

Once the ASF project has been unpacked (and the Makefile fixed), and a toolchain is installed, then we're ready to write and compile some code!
In the root of the directory where the ASF project's .atzip was unpacked, there will be a mostly-empty main.c, replace the contents of it with something like:

```
// More-or-less minimal LED blinking program using Atmel/Microchip START
// Ian Rees, MIT license, May 2017

#include <atmel_start.h>

#define RED_LED_PIN PIN_PA17

int main(void)
{
    gpio_set_pin_direction(RED_LED_PIN, GPIO_DIRECTION_OUT);

    while(1) {
        // This assumes we've got a fairly slow default clock
        for(long i = 0; i < 250*1000; ++i) {
            asm("NOP");
        }
        gpio_toggle_pin_level(RED_LED_PIN);
    }
}
```

Now, cd in to the gcc subdirectory, and do `make`.
You should see several invocations of gcc with a lot of arguments, something like:

```
$ make
Building file: ../hal/src/hal_io.c
ARM/GNU C Compiler
"arm-none-eabi-gcc" -x c -mthumb -DDEBUG -Os -ffunction-sections -mlong-calls -g3 -Wall -c -std=gnu99 \
-D__SAMD21G18A__ -mcpu=cortex-m0plus  \

...snipped lines...

"arm-none-eabi-objcopy" -j .eeprom --set-section-flags=.eeprom=alloc,load --change-section-lma \
        .eeprom=0 --no-change-warnings -O binary "AtmelStart.elf" \
        "AtmelStart.eep" || exit 0
"arm-none-eabi-objdump" -h -S "AtmelStart.elf" > "AtmelStart.lss"
"arm-none-eabi-size" "AtmelStart.elf"
   text	   data	    bss	    dec	    hex	filename
    620	      0	   8224	   8844	   228c	AtmelStart.elf
```

### OpenOCD configuration

OpenOCD is usually called with a series of configuration files and commands from the command line, we'll be using something like:

```
openocd -f interface/ftdi/dp_busblaster_kt-link.cfg -f feather.cfg -c init -c "program_elf AtmelStart.elf" -c shutdown
```

For that to work though, we first need to create a file, feather.cfg.
This is a Jim Tcl script - that's the interpreter built in to OpenOCD.

```
# Use SWD instead of JTAG
transport select swd

# For the moment, using the SAMD21 on an Adafruit Feather M0 Express
set CHIPNAME at91samd21g18
source [find target/at91samdxx.cfg]

adapter_nsrst_delay 100
adapter_nsrst_assert_width 100

proc program_elf {ELF_NAME} {
    global CHIPNAME
    puts "** Programming $CHIPNAME with $ELF_NAME **"

    reset halt

    # Turn off bootloader protection
    at91samd bootloader 0

    program $ELF_NAME verify

    # Re-enable bootloader protection
    at91samd bootloader 8192

    # Done!
    reset
}

return "** Loaded project configuration **"
```

### Setting up the Bus Blaster v4 for SWD

I followed instructions from [this gist](https://gist.github.com/natevw/14d1f1fe669ec6e201c5), which references a [forum thread](http://dangerousprototypes.com/forum/viewtopic.php?f=37&t=5954) at [Dangerous Prototypes](http://dangerousprototypes.com/).

Get KT Link buffer logic at [https://github.com/dergraaf/busblaster_v4/blob/master/ktlink/ktlink.svf](https://github.com/dergraaf/busblaster_v4/blob/master/ktlink/ktlink.svf).
With the bus blaster v4, set the Mode jumper to "Update Buffer" then do:

```
openocd -f board/dp_busblaster_v3.cfg -c "adapter_khz 1000; init; svf /full/path/to/ktlink.svf; shutdown"

```

The buffer logic lives in nonvolatile memory on the Bus Blaster, so this step only has to be done once.

### Electrical Connection

Four connections are required between the Bus Blaster v4 and the target board.
Other than the wire connections, the only component required (at least for these Atmel parts - this probably varies by chip manufacturer) is a 1kΩ pullup resistor on the SWCLK line.

| Bus Blaster v4 | Target Board |
| --- | --- |
| VTG | Vcc (3.3V or lower!)|
| TMS | SWDIO |
| TCK | SWCLK |
| Ground | Ground |

## Pulling it all Together

Once all the requirements above are accounted for, you should be able to hook up the Bus Blaster and Feather to your computer, cd in to the directory with AtmelStart.elf, and run the `openocd` command from the [top of the OpenOCD configuration section](#OpenOCD-configuration).

## Miscellaneous 

The original bootloader for the Adafruit Feather M0 boards can be found at [https://learn.adafruit.com/proper-step-debugging-atsamd21-arduino-zero-m0/restoring-bootloader](https://learn.adafruit.com/proper-step-debugging-atsamd21-arduino-zero-m0/restoring-bootloader).

Before I realised someone had made an ARM gcc package for Homebrew, I was trying to build the cross compiler with crosstool-ng.
I wasn't successful on this front, because there's a flag that needs to get set in the step where newlib is compiled (\_\_thumb2\_\_ needs to be defined), but I couldn't see how to easily make the crosstool-ng environment do it.
At any rate, the settings for crosstool-ng that I was working with, starting from `$ ct-ng arm-unknown-eabi` were fairly straightforward:

  * Emit assembly for CPU: cortex-m0plus
  * Default instruction set mode: thumb
  * Use the MMU: Unchecked

