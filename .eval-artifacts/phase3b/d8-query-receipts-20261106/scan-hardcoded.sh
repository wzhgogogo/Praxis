#!/usr/bin/env bash
base=$1; head=$2
git diff -U0 "$base" "$head" -- 'src/**/*.ts' \
  ':!src/**/*.test.ts' ':!src/**/fixtures/**' ':!src/eval/**' \
| awk '
/^\+\+\+ b\//{file=substr($0,7);next}
/^@@/{split($3,a,",");ln=substr(a[1],2)+0;next}
/^\+/{line=substr($0,2);
  hit="";
  if (line ~ /\/[^\/ ]*[\\\[\(\|][^\/]*\/[gimsuy]*[.,;) ]/ || line ~ /new RegExp\(/) hit=hit" REGEX";
  if (line ~ /\[ *"[^"]+" *, *"[^"]+/ || line ~ /\[ *'"'"'[^'"'"']+'"'"' *, *'"'"'/) hit=hit" WORDLIST";
  if (line ~ /https?:\/\/|"\/[a-z]+\/[a-z]*/) hit=hit" URL/PATH";
  if (line ~ /querySelector|\[data-|data-testid|className|"\.[a-zA-Z][-a-zA-Z0-9_]+|:nth-/) hit=hit" SELECTOR";
  if (line ~ /(tabelog|tablecheck|TABELOG|TABLECHECK)/ && line ~ /(if *\(|===|\?)/) hit=hit" SITE-BRANCH";
  if (hit!="") printf "%s:%d [%s ] %s\n", file, ln, hit, substr(line,1,180);
  ln++; next}
/^-/{next}'
