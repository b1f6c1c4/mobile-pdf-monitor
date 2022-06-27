# Mobile PDF Monitor

> Lightweight web server for easily monitor PDF changes on mobile device

## Install

```bash
npm i -g mobile-pdf-monitor
```

## Canonical Usage

Suppose you have a LaTeX document located at `~/work`, and you want to use a tablet to continuously view the output PDF as `latexmk` goes.

```
cd ~/work
pdfmon latexmk main.tex
> ......
> ......
>
> Launched web server on 8080 for main.pdf
> Listening on 8080 for main.pdf
>
```

## Technical Usage

```
Usage: To start a web server, run:
    pdfmon start <path-to-pdf>
  Note that the web server forks and runs in background.
To trigger reload, run:
    pdfmon reload
To quit daemon, run:
    pdfmon stop
To automatically run latexmk, run:
    pdfmon latexmk [<options>] <main.tex>

Note that <cwd> is very important for ALL those commands.
Adjust listening port by environment variable PORT.
```
