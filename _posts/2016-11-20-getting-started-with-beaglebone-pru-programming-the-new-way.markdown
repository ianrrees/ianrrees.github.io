---
layout: post
title: "Getting started with BeagleBone PRU programming the new way"
categories:
---

Over the last couple weekends, I've finally gotten back to playing with the BeagleBone, specifically using the PRUs to enable realtime hardware IO.
It's taken a lot more effort than I expected!

There are a lot of moving parts involved, most of which are in software that has changed since the launch (and surge of initial interest) in the BeagleBone.
So, there's a lot of outdated information around the 'net.

I intend for this post to provide a known-good starting point for doing development using the PRUs on the BeagleBone with reasonably modern Linux kernels (specifically 4.4.30).

For a good overview of the method discussed below, see the [TI wiki](http://processors.wiki.ti.com/index.php/PRU-ICSS_Remoteproc_and_RPMsg), though I believe some details around RPMsg using mailboxes may be outdated.

If you can't be bothered reading that last link - the general idea is that the Linux kernel runs on the main CPU (the ARM in our case) and manages sharing some memory with the firmware on the PRUs.

### Background

At a high level; inside the Sitara SoC, there are a couple small but fast RISC processors, PRUs, in addition to the main faster ARM CPU.
The PRUs are able to directly access the SoC's IO pins (and I think other peripherals), and L3 RAM shared with the main CPU.
This makes the PRUs ideal tools for interacting with the real world in real time.

Shortly after starting down the PRU programming path, you'll encounter a fork between the "legacy" UIO and the "Remote Processor Framework" methods of working with PRUs.
Unfortunately, I wasn't really paying attention and didn't appreciate the fork at first, so wasted a bit of time studying UIO.

While the UIO method looks fairly straightforward, and the majority of guides online describe it, the new way has some nice features (and I generally prefer to not start out with the old way).

The [Remote Processor Framework](https://www.kernel.org/doc/Documentation/remoteproc.txt) aims to be a standardised system for handling code on "remote" processors like the PRUs from the Linux kernel.
That said, the scheme is under development as it applies to PRUs, and has changed significantly over the last several months.

### Ingredients

My BeagleBone is a "Green Wireless" from [Seeed](https://www.seeedstudio.com/), though I suspect this information will apply to most/all boards that use the AM3358, like the BeagleBone Black.

Specifics in this post are based on the [Debian 8.6 2016-11-06 4GB SD IoT](https://debian.beagleboard.org/images/bone-debian-8.6-iot-armhf-2016-11-06-4gb.img.xz) image available from [beagleboard.org](https://beagleboard.org/latest-images), installed to the BeagleBone's eMMC flash.
This image includes the TI PRU C/C++ compiler and assembler (clpru), and [PRU Software Support Package](https://git.ti.com/pru-software-support-package) with useful PRU library code.

The only change I've made from the beagleboard.org image is to setup the WiFi (`connmanctl tether wifi off` is your friend).

We'll do all the work here on the BB, in the interest of keeping this post as straightforward as possible.
I usually SSH in, but the UART (either over USB or the debug header) would also work.

### Setting Up The Kernel

beagleboard.org's images are cleverly put together, in that they include both rproc and UIO support for the PRUs by default.
Only one of these can be used at a time though, so we need to enable rproc by modifying the "Device Tree Blob" in use.

Start by specifying an appropriate dtb for your board in `/boot/uEnv.txt` - common options are commented out in uEnv.txt, or there are lots of others under `/boot/dtbs/4.4.30-ti-r64/`.
In my case, I added `dtb=am335x-bonegreen-wireless.dtb` in uEnv.txt.

Edit the dts source for that dtb to uncomment the line that brings in PRU rproc support, rebuild it, then reboot.

    # cd /opt/source/dtb-4.4-ti/
    # vi src/arm/am335x-bonegreen-wireless.dts
       [uncomment line 22 to be: #include "am33xx-pruss-rproc.dtsi"]
    # make install
    # reboot

Once the board has rebooted, you should be able to confirm that the pru_rproc kernel module is loaded:

    root@beaglebone:~# lsmod | grep pru
    pru_rproc              15431  0 
    pruss_intc              8603  1 pru_rproc
    pruss                  12026  1 pru_rproc

### TI's PRU Examples

Building the included examples in the PRU Software Support Package is easy (once you know to do it, of course), and will help ensure that everything is working.
There's a much [nicer writeup on TI's wiki](http://processors.wiki.ti.com/index.php/PRU_Training:_Hands-on_Labs), but it assumes you're using Code Composer Studio, rather than a simple terminal.

    # ln -s /usr/bin/ /usr/share/ti/cgt-pru/bin
    # export PRU_CGT=/usr/share/ti/cgt-pru
    # cd /opt/source/pru-software-support-package/examples/am335x
    # make

At this point, we should be able to install one of the examples by copying it to `/lib/firmware` with the appropriate name, and run it by reloading the pru_rproc kernel module:

    # cp PRU_RPMsg_Echo_Interrupt0/gen/PRU_RPMsg_Echo_Interrupt0.out /lib/firmware/am335x-pru0-fw
    # rmmod pru_rproc
    # modprobe pru_rproc
    # dmesg | grep pru
      ...snip...
    [ 3846.584048]  remoteproc1: Booting fw image am335x-pru0-fw, size 73704
    [ 3846.584430] ti-pruss 4a300000.pruss: configured system_events = 0x0000000000030000 intr_channels = 0x00000005 host_intr = 0x00000005
    [ 3846.600101]  remoteproc1: remote processor 4a334000.pru0 is now up
    [ 3846.600555] virtio_rpmsg_bus virtio0: creating channel rpmsg-pru addr 0x1e
    [ 3846.661802] rpmsg_pru rpmsg0: new rpmsg_pru device: /dev/rpmsg_pru30

This particular demo just makes the PRU echo data back - not particularly exciting by itself (the PRU doesn't even modify the data!), but it's a good building block!

    # echo "Let's do more with hardware!" > /dev/rpmsg_pru30
    # cat /dev/rpmsg_pru30
    # Let's do more with hardware!

We can now use the nifty `config-pin` tool, and `PRU_gpioToggle` example to get a PRU talking with the outside world (but not the ARM host this time).
config-pin makes use of device tree overlays as discussed in the next section, I think it makes sense to use one or the other depending on your situation.
Two items to note first:

  * There seems to be a bug wherein the PRU firmware isn't loaded correctly on the first try (hence the rmmod/modprobe following reset) via pin P8.45.  I haven't looked in to the source of this issue.
  * Pin P8.45 is also used as a boot mode select pin, so don't load it significantly (eg with an LED + resistor) while booting.

    # cp PRU_gpioToggle/gen/PRU_gpioToggle.out /lib/firmware/am335x-pru1-fw
    # reboot
    # rmmod pru_rproc
    # modprobe pru_rproc
    # config-pin overlay cape-universala
    # config-pin P8.45 pruout

### Device Tree Overlays

Most of the IO balls on the SoC can be used in one of several "modes", and with different options within the selected mode.
The Device Tree tells Linux how to configure these, and we'll add to the device tree using an overlay.
Overlays written as dts source code like above in "setting up the kernel", but are compiled to dtbo overlays instead of dtb blobs.

I've uploaded a [basic overlay example]({{ site.url }}/media/pru-demo-00A0.dts), which sets 8 pins attached to PRU1 to be outputs from that PRU.
The interesting parts of the overlay source, at least for my purposes, are the list of components that we want exclusive use of, and the `pinctrl-single,pins=<...` section, which is a somewhat cryptic list of register offset and pin mode mask pairs.
I've found abusing this [online calculator](http://kilobaser.com/blog/2014-07-28-beaglebone-black-devicetreeoverlay-generator) to be more convenient than digging through the hardware manual to find the offsets and mode masks.
A word of caution: in some dts files I've found, the offset values always seems to start with 0x8, but my board only likes the ones that start with 0x0.
I'm not sure what's going on there.

The example can be compiled to dtbo like:
`# dtc -O dtb -o pru-demo-00A0.dtbo -b 0 -@ pru-demo-00A0.dts`.
The compiled dtbo file is then copied in to `/lib/firmware`, and loaded like:
`# echo pru-demo > /sys/devices/platform/bone_capemgr/slots` - note the version part is left off when loading.

You can tell which overlays are loaded with `# cat /sys/devices/platform/bone_capemgr/slots`.

To tell the resulting state of the pins, you can check the status of the MUX using something like `# cat /sys/kernel/debug/pinctrl/44e10800.pinmux/pinmux-pins | grep P8.45`

### PRU Development Notes

In general, PRU firmware written for UIO environments won't work with remote-proc ones, without at least a little modification.  An important difference between the UIO and the remote processor framework, is that UIO uses raw object code (at least I believe that is the case), and rproc uses ELF binaries.
This is because the rproc driver needs the .resource_table section of the firmware ELF to setup vrings as appropriate.
So, while it's possible to write PRU firmware entirely in assembler, it'll be more straightforward with a C compiler and linker.

Fortunately, a C/C++ compiler and linker come with our BeagleBone image.
And of course, it's not hard to mix assembly and C source.
The [PRU Optimizing C/C++ Compiler User's Guide](http://www.ti.com/lit/ug/spruhv7a/spruhv7a.pdf) from TI has a really good section on mixing assembler and C (or C++).

The companion website for the book [Exploring BeagleBone](http://exploringbeaglebone.com/) has a handy [cheat sheet for PRU assembler](http://exploringbeaglebone.com/wp-content/uploads/2014/12/Instruction-Set-Sheet-728x1024.png) - it's pretty basic, exactly what we want!
The [TI wiki](http://processors.wiki.ti.com/index.php/PRU_Assembly_Instructions) has more in-depth discussion.

One important detail is that the Linux kernel driver needs to match with the firmware compiled in to the PRU, if they're going to work together.
I've found that most example PRU rproc code won't build with newer versions PRU Software Support Package, but if you downgrade it, then you'll also need to build a similar vintage kernel module to get things working.

I found [this elinux.org page](http://elinux.org/EBC_Exercise_30_PRU_via_remoteproc_and_RPMsg) to be very helpful in getting up to speed on PRUs.
