# 80% solution to track php dependencies

This tool scan php code and builds a dependency graph based on the use statements in the code.

## Setup
```
git clone git@github.com:Christian-Rades/tracdep.git
cd tracdep
npm install
```

## Use
Generate a list of all units(classes, interfaces, traits) and their dependencies:
```
npm run gen --target=<path to your source code>
```

Start the websever:
```
npm run start
```

Look at the results at localhost:3000
