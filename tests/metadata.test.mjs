import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('page and social preview metadata are English in the initial HTML',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<html lang="en">/);
  const head=html.split('</head>')[0];
  assert.doesNotMatch(head,/[\u0400-\u04ff]/);
  for(const key of ['description','og:title','og:description','og:url','og:locale','twitter:title','twitter:description']){
    assert.match(head,new RegExp(`(?:name|property)="${key}" content="[^"]+"`));
  }
  assert.match(head,/property="og:locale" content="en_GB"/);
});
