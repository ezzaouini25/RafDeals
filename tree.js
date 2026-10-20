const fs = require("fs");
const path = require("path");

const ignore = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  "out"
]);

function walk(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !ignore.has(e.name));

  entries.forEach((entry, index) => {
    const last = index === entries.length - 1;
    console.log(prefix + (last ? "\\--- " : "+--- ") + entry.name);

    if (entry.isDirectory()) {
      walk(
        path.join(dir, entry.name),
        prefix + (last ? "    " : "|   ")
      );
    }
  });
}

console.log(path.basename(process.cwd()));
walk(process.cwd());


// command for build the tree : node tree.js > project-tree.txt