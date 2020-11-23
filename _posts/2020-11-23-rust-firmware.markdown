---
layout: post
title: "Rust Firmware"
categories:
---

For both work and personal projects lately, I've been working on firmware for ARM M0+ microcontrollers, written in Rust. Although the "ecosystem" is young and rapidly evolving, I feel like it is already useful in a commercial context. Hopefully that last sentence ages well!

## Getting assembler listings
`cargo-binutils` is what you're looking for here; it provides a set of cargo commands for the programs in binutils. Install it like `cargo install cargo-binutils`, and use it like `cargo objdump --release -- --source --disassemble --section .txt`.

Everything before the ` -- ` is handled by cargo, and after it is handled by objdump. So, `cargo objdump --help` gives the cargo help, `cargo objdump -- --help` gives the objdump help.
