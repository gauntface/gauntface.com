---
title: "Label printing with a raspberry pi"
excerpt: "There are a few guides on setting up Dymo label writers to work with Raspberry Pi's but a lot seem to be out of date, this is what worked for me."
mainImage: ""
mainImageAlt: ""
date: "2020-05-23T12:00:00-07:00"
---

# Label printing with a raspberry pi

After looking through quite a few blog and forum posts I managed to get my Dymo Label Writer 450 Turbo
to work with my Raspberry Pi and share it on the local network.

The high-level steps are:

1. Install cups and get the cups server working.
1. Install the Dymo drivers.
1. Add the printer to cups.

## Installing cups

With the driver installed the next step is to set up cups and share the printer on the network.

This post on [chicagodist.com](https://chicagodist.com/blogs/news/15272985-using-the-raspberry-pi-as-a-print-server-for-a-dymo-4xl-label-printer) was super
helpful in setting up cups.

The steps to install cups is simply:

```shell
sudo apt-get install cups
sudo usermod -a -G lpadmin pi
```

To configure the cups server, they recommend editing `/etc/cups/cupsd.conf` to expose the
server port:

```
# Listen localhost:631
Port 631
```

The altering the locations to include `Allow @local` in the `<Location *>` sections:

```
< Location / >
# Restrict access to the server...
Order allow,deny
Allow @local
< /Location >

< Location /admin >
# Restrict access to the admin pages...
Order allow,deny
Allow @local
< /Location >

< Location /admin/conf >
AuthType Default
Require user @SYSTEM

# Restrict access to the configuration files...
Order allow,deny
Allow @local
< /Location >
```

Once you've made these changes restart cups server:

```shell
sudo /etc/init.d/cups restart
```

## Dymo Drivers

The first hurdle was getting the Dymo drivers to install correctly. Originally I tried using
the label printer without this and it kinda worked but the quality wasn't great, the sizing
was off and it wasn't possible to access it from my Windows machine.

Dymo provides drivers for linux however the soure they provide doesn compile:

```shell
hello@piworld:~/dymo-cups-drivers-1.4.0.5 $ make
Making all in src
make[1]: Entering directory '/home/hello/dymo-cups-drivers-1.4.0.5/src'
make  all-recursive
make[2]: Entering directory '/home/hello/dymo-cups-drivers-1.4.0.5/src'
Making all in lw
make[3]: Entering directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw'
Making all in tests
make[4]: Entering directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw/tests'
make[4]: Nothing to be done for 'all'.
make[4]: Leaving directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw/tests'
make[4]: Entering directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw'
g++ -DHAVE_CONFIG_H -I. -I../../src -I../common    -O2 -Wall -Wno-unknown-pragmas   -MT raster2dymolw.o -MD -MP -MF .deps/raster2dymolw.Tpo -c -o raster2dymolw.o raster2dymolw.cpp
In file included from raster2dymolw.cpp:37:
../common/CupsFilter.h: In member function ‘int DymoPrinterDriver::CCupsFilter<D, DI, LM>::Run(int, char**)’:
../common/CupsFilter.h:135:10: warning: ‘template<class> class std::auto_ptr’ is deprecated [-Wdeprecated-declarations]
     std::auto_ptr<CHalftoneFilter> H;
          ^~~~~~~~

... More output like this, you get the idea ....

   cupsParseOptions
../common/CupsFilter.h:243:45: error: ‘ppdFindMarkedChoice’ was not declared in this scope
   ppd_choice_t* choice = ppdFindMarkedChoice(ppd, "DymoHalftoning");
                          ~~~~~~~~~~~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~
../common/CupsFilter.h:248:11: error: ‘ppdClose’ was not declared in this scope
   ppdClose(ppd);
   ~~~~~~~~^~~~~
../common/CupsFilter.h:248:11: note: suggested alternative: ‘pclose’
   ppdClose(ppd);
   ~~~~~~~~^~~~~
   pclose
raster2dymolw.cpp: At global scope:
raster2dymolw.cpp:125:1: fatal error: opening dependency file .deps/raster2dymolw.Tpo: Permission denied
 }
 ^
compilation terminated.
make[4]: *** [Makefile:345: raster2dymolw.o] Error 1
make[4]: Leaving directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw'
make[3]: *** [Makefile:435: all-recursive] Error 1
make[3]: Leaving directory '/home/hello/dymo-cups-drivers-1.4.0.5/src/lw'
make[2]: *** [Makefile:262: all-recursive] Error 1
make[2]: Leaving directory '/home/hello/dymo-cups-drivers-1.4.0.5/src'
make[1]: *** [Makefile:204: all] Error 2
make[1]: Leaving directory '/home/hello/dymo-cups-drivers-1.4.0.5/src'
make: *** [Makefile:263: all-recursive] Error 1
```

[Kyle Falconer created a GitHub repo](https://github.com/Kyle-Falconer/DYMO-SDK-for-Linux) 
which is a fork of the Dymo driver with patches applied to fix the compilation.

The steps below are from the [README](https://github.com/Kyle-Falconer/DYMO-SDK-for-Linux):

```shell
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install git libcups2-dev libcupsimage2-dev gcc g++ automake
cd ~/
git clone https://github.com/Kyle-Falconer/DYMO-SDK-for-Linux.git
cd DYMO-SDK-for-Linux
aclocal
automake --add-missing
autoconf
./configure
make
sudo make install
```

## Add printer to cups

## Links

Below are some other links I hit while digging around that might be helpful:

- [BadgeHub a tool to generate a print labels](https://github.com/codeforsanjose/BadgeHub)
- [Setting up a CUPS network printer on Windows 10](https://zedt.eu/tech/windows/installing-an-ipp-printer-in-windows-10/)
- [CUPS command line printing options](https://www.cups.org/doc/options.html)
    - NOTE: For this I used `lp` because it provided the common flags referenced on
      all the posts and code samples I came across.
- [Useful post highlighting differences between `lp` and `lpr`](https://www.raspberry-pi-geek.com/Archive/2016/20/Print-with-shell-commands-courtesy-of-CUPS)