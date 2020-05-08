#!/bin/bash
set -e

npm install
      
npm run build

aws s3 sync ./public/ s3://www.gauntface.com/ --delete --acl public-read

aws s3 cp \
s3://www.gauntface.com/ s3://www.gauntface.com/ \
--metadata-directive REPLACE \
--cache-control 'max-age=86400' \
--exclude="*" \
--include="*.html" \
--include="*.xml" \
--include="*.json" \
--include="*.svg" \
--acl public-read \
--recursive

aws s3 cp \
s3://www.gauntface.com/ s3://www.gauntface.com/ \
--metadata-directive REPLACE \
--cache-control 'max-age=31104000' \
--exclude="*" \
--include="*.css" \
--include="*.js" \
--include="*.png" \
--include="*.jpg" \
--include="*.jpeg" \
--include="*.gif" \
--include="*.webp" \
--include="*.woff" \
--include="*.woff2" \
--acl public-read \
--recursive