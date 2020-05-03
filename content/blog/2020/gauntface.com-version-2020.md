---
title: "New version of gauntface.com"
excerpt: "An updated version of gauntface.com means a new blog post. This will include Hugo, AWS, GitHub actions and a Go program."
mainImage: "/images/blog/2020/2020-05-01/begin-cup.jpg"
mainImageAlt: "Clouds over a flourescent blue sea"
date: "2020-05-01T12:00:00-07:00"
updatedOn: "2020-05-01T12:00:00-07:00"
---

# New version of gauntface.com

There is a general cadence for me to change my site once every year or two, either because I
get tired of the look of it or the stack is just not working for me.

## Old stack

The previous version of my site was using a custom built static site generator and I bailed on
it because I was starting to want features that were common in all other static site generators
and I couldn't justify the work.

The reason I had built the generator was because I had this idea of templates being able to define the CSS and JS they needed and as part of the template generation the CSS and JS would be added as necessary. I
was largely happy with the end result but there was enough rough edges that it was a "death by a thousand papercuts" kind of feeling.

The other details of the tech I used:

- Hosted on [Netlify](https://www.netlify.com/)
- [Custom static site generator](https://github.com/gauntface/hopin-static-site)
- Markdown for content
- [Gulp](https://gulpjs.com/) for asset compilation & minification
- [Typescript](https://www.typescriptlang.org/) for in page JS
- [PostCSS](https://postcss.org/) for styles

## New stack

The new stack has some old and new in it and the biggest driver for the change was to switch to
a widely used static site generator, which resulted in:

- ✨ Hosting on [AWS](https://aws.amazon.com/)
- ✨ [Hugo](https://gohugo.io/) for static site generation
- ✨ Custom scripts from ["go-html-asset-manager"](https://github.com/gauntface/go-html-asset-manager) 
    for production builds
- 👌 Markdown for content
- 👌 [Gulp](https://gulpjs.com/) for asset compilation & minification
- 👌 [Typescript](https://www.typescriptlang.org/) for in page JS
- 👌 [PostCSS](https://postcss.org/) for styles

That's three new (✨) things and a bunch of tools I've stuck with (👌).

I stuck with markdown, Gulp, Typescript and PostCSS because they all work for me and I've had
enough of an issue with any of them to really opt for anything else that's I've seen and / or tried.

Now, why the changes?

### AWS for hosting

The move to AWS was driven by a desire to learn AWS. Netlify has a fantastic feature set and 
I'd still recommend it to folks if they haven't tried it. (I may go back once I get a feel for
the average cost of AWS).

AWS Hosting is simple, store the site in an S3 bucket with Cloudfront for the CDN, you 
can [learn more in this post](/blog/2020/static-site-hosting-on-aws/).

The deployment of the site is managed by 
[a GitHub Action](https://github.com/gauntface/gauntface.com/blob/master/.github/workflows/publish.yml)
so I didn't lose the auto-deploy feature that Netlify provided.

### Hugo for site generation

After working in golang for the past few years I wanted to try [Hugo](https://gohugo.io/), I'd
heard nothing but good things about it, so why not right?

The performance of Hugo is fantastic. My site builds in < 3s containing ~150 posts and the dev 
server can update individual pages in < 200ms.

[Theming in Hugo](https://gohugo.io/hugo-modules/theme-components/) has been fun to work with 
because you can apply more than one theme, which I'm using to have a "base" theme and a site 
specific theme. The base theme includes common partials, layouts etc used by multiple sites
and the site specific theme adds partials and layouts for this site, falling back to the base
theme where appropriate.

### Custom script: go-html-asset-manager

`go-html-asset-manager` is a Go program I created to help optimise my site in an automated way.

Some of the operations it performs:

- Generates multiple sizes and types of images
- Convert `img` tags to `picture` elemens using generated images
- Wraps iframes and images in divs to maintain aspect ratio
- Replace YouTube iframes with a still and load the iframe asynchronously
- Inject CSS & JS that apply to the page

A lot of these operations are simple translations. The injection of the CSS & JS is probably the
most quirky part of this implementation.

The CSS and JS files follow the naming convention: 
`<html tag | class name | attribute key>(-<inline | sync | async>)?.<js | css>`.

This makes it easy to tie HTML to the appropriate CSS and JS files. For an example, the HTML 
`<pre class="language-yaml"><code>example</code></pre>` can have the CSS and JS files:

```
/css/pre.css
/css/pre-async.css
/css/pre-async.js
/css/language-yaml-async.css
/css/code.css
/css/code-async.css
```

For development builds, all CSS and JS files are added to the page and loaded synchronously. Using
functions like [readDir](https://gohugo.io/functions/readdir/#readout) a theme can crawl the
local file system and load them in the page. This is great for local development since I
just need to create a file and it's available to use in a page.

For production builds, the theme doesn't include any styles or scripts and `go-html-asset-manager`
parses each HTML page and injects the styles and scripts either inlining the file or adding the
asset to load as a syncrhonous, asynchronous or preload file.

The **good parts** of `go-html-asset-manager` is that it enables the content and themes to be kept
simple while resulting in an efficient site and this tool is agnostic to the site generator.

The **bad parts** of `go-html-asset-manager` is that some of the mutations can cause differences
in the final appearance.

## What next

Overall I've been really happy with the end result and it's made it really easy to improve the
performance of my site in a consistent way.

I don't have too much planned for the current set up outside of improving the development of
styleguides for my themes which are still a little iffy to develop and work with.