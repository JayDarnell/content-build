#!/usr/bin/env bash
if [ ! -d ../vagov-content ]; then
  git clone --single-branch --depth 1 https://github.com/department-of-veterans-affairs/vagov-content.git ../vagov-content
else
  echo "Repo vagov-content already cloned."
fi

if [ ! -d ../vets-website ]; then
  git clone --single-branch --depth 1 https://github.com/department-of-veterans-affairs/vets-website.git ../vets-website
else
  echo "Repo vets-website already cloned."
fi

if [ ! -d ../vets-api ]; then
  git clone --single-branch --depth 1 https://github.com/department-of-veterans-affairs/vets-api.git ../vets-api
else
  echo "Repo vets-api already cloned."
fi

# Added here to demonstrate Gatsby/Metalsmith integration.
if [ ! -d ../cms-content-gatsby-poc ]; then
  git clone --single-branch --depth 1 "https://va-cms-bot:${GITHUB_TOKEN}@github.com/department-of-veterans-affairs/cms-content-gatsby-poc.git" ../cms-content-gatsby-poc
  cd .. && npm cache clean --force && npm install
else
  echo "Repo cms-content-gatsby-poc already cloned."
fi
