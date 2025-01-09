# Introduction

This web-application is a simple builder and real-time simulator for basic combinational logic-circuits.


# Building and Running the application

Building and running this project from source requires having NodeJS installed.

First, install dependencies with `npm i`, then build and run application with `npm run build && npm run preview`.

Some parts of this app are implemented in C++, which has been compiled into WebAssembly using Emscripten. The build scripts seen in the `/src/application/server` directory of this project (ex: "build-wasm-debug.sh") refer to a local installation of the EmscriptenSDK, but that is not included with this project.

For more information, see: https://emscripten.org/index.html

# Who is this application for?

- It is for students taking introductory courses in computer-architecture.
Being able to play with logic circuits in real-time is really helpful for understanding how they work, as well as quickly prototyping them. There wasn't any obvious software options for this doing this back when I was taking comp-arch, and I often ended up using Quartus to build most of the circuits we were shown in class, however I found Quartus to be very difficult to use, and it didnt seem to have functionality for interactively simulating circuits. If I could've submitted my homework as templates built with this application, it would have saved me a lot of time and effort.

- It is a for professors teaching computer-architecture.
When taking Computer Architecture I & II in university, professors usually drew the circuits on a whiteboard and then explained what they would do, but they werent really *demonstrating* them. I created this app to close the software gap, giving professors a convenient way to visually interact with circuits in real-time, *showing* students what they do.

- It is also for people who just want to play with logic circuits.


# User Guide

See "Help" panel in the application:
https://johnfarbotnik3.github.io/logic-sim-site/
