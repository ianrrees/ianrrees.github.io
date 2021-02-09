---
layout: post
title: "Rust Firmware"
categories:
---

For both work and personal projects lately, I've been working on firmware for ARM M0+ microcontrollers, written in Rust. Although the "ecosystem" is young and rapidly evolving, I feel like it is already useful in a commercial context. Hopefully that last sentence ages well!

## Getting assembler listings
`cargo-binutils` is what you're looking for here; it provides a set of cargo commands for the programs in binutils. Install it like `cargo install cargo-binutils`, and use it like `cargo objdump --release -- --source --disassemble --section .txt`.

Everything before the ` -- ` is handled by cargo, and after it is handled by objdump. So, `cargo objdump --help` gives the cargo help, `cargo objdump -- --help` gives the objdump help.

## Typestate programming with generics
[Typestate programming](https://doc.rust-lang.org/stable/embedded-book/static-guarantees/typestate-programming.html) is an aspect of Rust that I've been finding very helpful, especially combined with generics. In an embedded context, the idea is to describe hardware constraints as Rust types, often [zero-cost abstractions](https://doc.rust-lang.org/stable/embedded-book/static-guarantees/zero-cost-abstractions.html), so code that violates those constraints will fail to compile.  For example, [this](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=e0f3d0fa2de7e3bbd7a8c5c1028e06e2) describes a chip that will only allow for some specific configurations.

## Converting integers between signed to unsigned
A silly little thing, but if you need to do the equivalent of this often-implicit C-style cast:
``` C
int8_t uint8_t_to_int8_t(uint8_t input) {
    return (int8_t)input;
}
```
The Rust equivalent is to use the from/to bytes methods; the "bytes" are always u8.
``` Rust
fn u8_to_i8(input: u8) -> i8 {
    i8::from_ne_bytes(input.to_ne_bytes())
}
```
