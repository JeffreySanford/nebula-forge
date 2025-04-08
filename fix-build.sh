#!/bin/bash

# Fix the package dependencies
echo "Installing Angular dependencies with legacy peer deps..."
npm install @angular/router@~17.3.0 @angular/material@~17.3.0 @angular/cdk@~17.3.0 d3@^7.8.5 @types/d3@^7.4.3 --legacy-peer-deps

# Create user-state stylesheet if it doesn't exist
mkdir -p apps/star-chart-web/src/app/components/user-state/
touch apps/star-chart-web/src/app/components/user-state/user-state.component.scss

# Fix the @ symbols in HTML templates
sed -i 's/@ /\&#64; /g' apps/star-chart-web/src/app/components/graphql-tile/graphql-tile.component.html
sed -i 's/@ /\&#64; /g' apps/star-chart-web/src/app/components/metrics-tile/metrics-tile.component.html

echo "Changes applied. Trying build..."
npx nx run star-chart-web:build
