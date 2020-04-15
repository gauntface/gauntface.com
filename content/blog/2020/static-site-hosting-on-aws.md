---
title: "Continuous Deployment with AWS and GitHub Actions"
excerpt: "Continuous deployment with AWS and GitHub Actions is
fairly easy to set up and use."
mainImage: "/images/blog/2020/2020-04-05/clouds.jpg"
date: "2020-04-05T12:00:00-07:00"
---
![Clouds over a flourescent blue sea](/images/blog/2020/2020-04-05/clouds.jpg)

# Continuous Deployment with AWS and GitHub Actions

After using [Netlify](https://www.netlify.com/) and 
[Firebase](https://firebase.google.com/) to host different sites I reached a 
point where I was hitting limits on the free tiers they offer.

To reduce costs I ended up switching to [AWS](https://aws.amazon.com/) with
[GitHub actions](https://github.com/features/actions) for continuous deployment.

Overall the process was easier than I expected.

## Hosting on AWS

I'm pretty new to AWS and found [this video](https://www.youtube.com/watch?v=DiIaoIcoKNY) 
to be the most helpful to get me started and more familiar with 
[S3](https://aws.amazon.com/s3/) and [Cloudfront](https://aws.amazon.com/cloudfront/).

<iframe width="560" height="315" src="https://www.youtube.com/embed/DiIaoIcoKNY?controls=0" frameborder="0" allow="picture-in-picture" allowfullscreen></iframe>

The approach is to upload your site to an S3 Bucket to store and host your files
and configure a Cloudfront distribution to be a CDN to serve and cache files
from your bucket.

After uploading my files and getting Cloudfront to serve from S3 I realized 
that Cloudfront was unable to serve `index.html` files from from a directory,
it can only serve `index.html` for the home page.

This was a problem for me since [Hugo](https://gohugo.io/) will create index
pages in directories to create  [clean URLs](https://en.wikipedia.org/wiki/Clean_URL).
For example, it would create `/blog/2019/09/post-slug/index.html` and use the 
URL `/blog/2019/08/post-slug/` as a link to this page. This behavior was easy to change
in Hugo by adding `uglyURLs: true` to the config for my sites, causing Hugo to create
`/blog/2019/08/post-slug.html` instead of a nested `index.html` file.

### Custom domains

Adding a custom domain is easy enough and it **doesn't** require [Route 53](https://aws.amazon.com/route53/), despite how it seems in all of the AWS material.

You need to create a certificate for you domain using
[AWS's Certificate Manager](https://console.aws.amazon.com/acm/home?region=us-east-1#/), 
just ensure you are creating certificates in the `us-east-1 (N Virginia)` region as this
is the [only region Cloudfront can read certificates from](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-aws-region).

I ended up created a certificate for both `gauntface.com` and `*gauntface.com` so it
could be used for the naked domain and any subdomains.

I went through the DNS flow to verify a couple of domains and it took around 5 - 15 
minutes. Once the certificates were issued I could add my domain to the *Alternate Domain Names* in my Cloudfront distribution and select the appropriate certificate under
*Custom SSL Certificate*.

### Naked and www domains

After Cloudfront was set up to serve my site as www.gauntface.com, I wanted
to set up redirects for the naked domain (i.e. gauntface.com -> www.gauntface.com).

The naked domain required a seperate S3 Bucket and Cloudfront distribution and the
configuration and usage of these differed as well.

`www.gauntface.com` was set up such that the Cloudfront distrubtion's *Origin Domain
Name* was was to the  S3 Bucket with *Restrict Bucket Access* set to *Yes*. This meant
that Cloudfront would request assets from the bucket with an identity that
had permissions to read from it. Behind the scenes, Cloudfront is using a Rest
API to read from the bucket. The S3 Bucket in this case was just used to host the files.

For the naked domain I created an empty S3 Bucket and setup the *Static website 
hosting* property to *Redirect requests*. With this, the bucket has a URL that you can 
use to access the site, and it'll simply redirect you to whatever site you configure. 
When creating the Cloudfront distribution the *Origin Domain Name* need to be set to the 
URL of the buckets *Static website hosting* property. This causes Cloudfront to make 
network requests to the S3 Bucket's static site, which will respond with redirects.

With all of the above set up, I had a working site that was easy to update from the 
command line. The next step was to set up continuous deployment so the site would
deploy updates as changes were made.

## Continuous Deployment with GitHub Actions

GitHub actions were the obvious choice for this since I host my sites on GitHub
and I am already on the pro plan.

I'm still new to GitHub Actions and there is some redundancy in my
setup at the moment, but it's working well enough to share.

### Build on PRs

On a Pull Request I want to know that the site builds before it's merged which
was achieved with the following GitHub Action workflow (saved to `.github/workflows/build.yml` in my repo):

```yaml
on: push
name: Build
jobs:
  all:
    name: Build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: Setup Hugo
      uses: peaceiris/actions-hugo@v2
      with:
        hugo-version: '0.62.2'
    - name: Install
      run: npm install
    - name: Build
      run: npm run build
```

These steps do the following:

-   `uses: actions/checkout@master`
    - This is a GitHub action that checksout the repo the action is running against. 
      The `@master` in this action refers to the master branch of the 
      [action's source code](https://github.com/actions/checkout) and not the master
      branch of the repo running the action.
-   `name: Setup Hugo ↵ uses: peaceiris/actions-hugo@v2`
    - My site is using Hugo for a static site generator and this action will retrieve
      and configure a specific version of hugo. 
-   `name: Install ↵ run: npm install`
    - I'm using gulp to manage my build process for the site, including calling out
      to Hugo, so I need to install it's dependencies from NPM.
-   `name: Build ↵ run: npm build`
    - Final step is to build my site by running an NPM run script.

These steps are for specific to my build process and you'll need to adjust this for your
sites needs, but it demonstrates how you can configure a chain of steps.

As pull requests are opened, this action will run and ensures that my
site can install dependencies and build.

![GitHub Build Action in a Pull Request](/images/blog/2020/2020-04-05/github-build-action.png)

You can find the 
[workflows for my site here](https://github.com/gauntface/gauntface.com/tree/master/.github/workflows).

### Deploy the Master Branch

Whenever a commit is pushed to the master branch I wanted to build and deploy the site.

At the moment this is achieved with a seperate GitHub workflow but it should be merged
with the build workflow above to avoid duplication.

The full workflow is:

```yaml
on:
  push:
    branches:
      - master
name: Deploy Site
jobs:
  all:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: Setup Hugo
      uses: peaceiris/actions-hugo@v2
      with:
        hugo-version: '0.62.2'
    - name: Install
      run: npm install
    - name: Build
      run: npm run build
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-1
    - name: Upload to S3
      run: aws s3 sync ./public/ s3://www.gauntface.com/ --delete
```

The key differences are the the start and end of the workflow.

```yaml
on:
  push:
    branches:
      - master
```

This controls when the deploy workflow will run. **On** a **push** to any **branches** 
named **master**, run this workflow.

Then we have the same steps as before, checkout the repo, install dependencies, build the 
site followed by two new steps:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: <AWS Region - us-east-1>
- name: Upload to S3
  run: aws s3 sync ./< Directory with Built Site >/ s3://<Bucket Name>/ --delete
```

The first step sets up the AWS CLI using the `aws-actions/configure-aws-credentials@v1` 
action and two secrets `secrets.AWS_ACCESS_KEY_ID` and `secrets.AWS_SECRET_ACCESS_KEY`. 

The secrets are the key ID and secret for the credentials for an AWS user which you
can create on the 
[AWS Identity and Access Management (IAM)](https://console.aws.amazon.com/iam/home?region=us-east-1#/home) 
console. You'll need the user to have write access to your S3 bucket. 
Once create, you just need to add the key ID and secrity key your
[GitHub repos secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)
which can be done in your repo's Settings page.

![GitHub Secrets Page](/images/blog/2020/2020-04-05/github-settings-secrets.png)

The second step runs the the same `aws s3` command that you would run from your computer 
to upload files to S3.

## GitHub Branch Protection

One **risk** with continuous deployment is that if you push a commit to master
that breaks the build of your site, you will not be able to deploy changes to your
site until it's fixed.

Avoid this situation with 
[Branch Protections](https://help.github.com/en/github/administering-a-repository/about-protected-branches)
to restrict pushes to the master branch.

I've set up my repo such that I can't push commits to master and
that Pull Requests must pass the Build action before they can be merged.

![GitHub Branch Protection Configuration](/images/blog/2020/2020-04-05/github-branch-protection.png)

## Fin.

I would recommend anyone to give this a go if you are looking for an
easy way to run a site directly on AWS.

It is missing some of the bells and whistles from Netlify, but it's
good enough for my needs and I really don't need much.