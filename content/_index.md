---
title: "Home"
---

# Hello.

My name is Matt, I'm a software engineer who works on various things and this is my personal site which has my blog and info on recent projects.

<!-- #each (hopin_limitArray navigation.blog.leafNodes 3) -->
<a href="{{url}}" class="c-home-blog-link">

<h3>{{title}}</h3>

{{yaml.excerpt}}

</a>
{{/each}}

<h2>Side Projects</h2>

<h2>Web Push Book</h2>

Having spent a large amount of time playing with web push I put together a collection of information into "a kind of book" that you can grab [from the web-push-book](https://web-push-book.gauntface.com/).

<h2>Smashing Book 5</h2>

I've written a chapter in the [Smashing Book 5](https://shop.smashingmagazine.com/products/smashing-book-5-real-life-responsive-web-design) on service workers and it's now available in print or ebook.