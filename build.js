const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'site');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const TEMPLATES = path.join(ROOT, 'templates');
const BASE = 'https://shivsareeemporiumfrontierwale.netlify.app';

function rmrf(p){ if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true}); }
function mkdir(p){ fs.mkdirSync(p,{recursive:true}); }
function read(p){ return fs.readFileSync(p,'utf8'); }
function write(p,s){ mkdir(path.dirname(p)); fs.writeFileSync(p,s); }
function copyDir(src,dst){
  mkdir(dst);
  for(const e of fs.readdirSync(src,{withFileTypes:true})){
    const a=path.join(src,e.name), b=path.join(dst,e.name);
    if(e.isDirectory()) copyDir(a,b); else fs.copyFileSync(a,b);
  }
}
function esc(s=''){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function slugify(s){
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'post';
}
function parseFrontmatter(src){
  const m=src.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if(!m) return {data:{},body:src};
  const data={};
  for(const line of m[1].split(/\r?\n/)){
    const i=line.indexOf(':'); if(i<0) continue;
    let k=line.slice(0,i).trim(), v=line.slice(i+1).trim();
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
    if(v.startsWith('[') && v.endsWith(']')){
      try{ data[k]=JSON.parse(v.replace(/'/g,'"')); }catch{ data[k]=v.slice(1,-1).split(',').map(x=>x.trim()).filter(Boolean); }
    } else data[k]=v;
  }
  return {data,body:m[2]};
}
function inlineMd(s){
  let x=esc(s);
  x=x.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy">');
  x=x.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  x=x.replace(/__([^_]+)__/g,'<strong>$1</strong>');
  x=x.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  return x;
}
function markdownToHtml(md){
  const lines=String(md||'').replace(/\r/g,'').split('\n');
  let out=[], para=[], list=false;
  const flushPara=()=>{ if(para.length){ out.push('<p>'+para.map(inlineMd).join('<br>')+'</p>'); para=[]; }};
  const closeList=()=>{ if(list){ out.push('</ul>'); list=false; }};
  for(const line of lines){
    if(/^\s*$/.test(line)){ flushPara(); closeList(); continue; }
    let m=line.match(/^###\s+(.+)/); if(m){flushPara();closeList();out.push('<h3>'+inlineMd(m[1])+'</h3>');continue;}
    m=line.match(/^##\s+(.+)/); if(m){flushPara();closeList();out.push('<h2>'+inlineMd(m[1])+'</h2>');continue;}
    m=line.match(/^#\s+(.+)/); if(m){flushPara();closeList();out.push('<h2>'+inlineMd(m[1])+'</h2>');continue;}
    m=line.match(/^[-*]\s+(.+)/); if(m){flushPara();if(!list){out.push('<ul>');list=true;}out.push('<li>'+inlineMd(m[1])+'</li>');continue;}
    para.push(line);
  }
  flushPara();closeList(); return out.join('\n');
}
function loadCollections(){
  const dir=path.join(CONTENT,'collections'); mkdir(dir);
  return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>{
    const x=JSON.parse(read(path.join(dir,f))); x.id=f.replace(/\.json$/,''); return x;
  }).filter(x=>x.published!==false);
}
function loadBlogs(){
  const dir=path.join(CONTENT,'blogs'); mkdir(dir);
  return fs.readdirSync(dir).filter(f=>f.endsWith('.md')).map(f=>{
    const {data,body}=parseFrontmatter(read(path.join(dir,f))); data.id=f.replace(/\.md$/,''); data.slug=data.slug||slugify(data.title||data.id); data.body=body; return data;
  }).filter(x=>x.published!==false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
function cardBlog(b){
  return `<article class="card"><div class="card-body"><span class="eyebrow">${esc(b.category||'General')}</span><h3>${esc(b.title||'Untitled')}</h3><p class="small">${esc(b.date||'')}</p><p>${esc(b.description||b.excerpt||'')}</p><a class="btn" href="/blog/${esc(b.slug)}/">Read Article</a></div></article>`;
}
function cardCollection(c){
  return `<article class="card collection-card"><img src="${esc(c.image)}" alt="${esc(c.alt||c.title||'Ladies suit')}" width="900" height="1200" loading="lazy" decoding="async"><div class="card-body"><span class="eyebrow">${esc(c.category||'Suit Collection')}</span><h3>${esc(c.title||'Ladies Suit')}</h3><p>${esc(c.description||'Explore this suit style from our Chandni Chowk collection.')}</p></div></article>`;
}
function replaceAll(s, token, value){ return s.split(token).join(value); }

rmrf(DIST); copyDir(SOURCE,DIST); copyDir(path.join(ROOT,'admin'), path.join(DIST,'admin'));
if(fs.existsSync(path.join(ROOT,'robots.txt'))) fs.copyFileSync(path.join(ROOT,'robots.txt'), path.join(DIST,'robots.txt'));
const collections=loadCollections();
const blogs=loadBlogs();
let siteSettings={};
const settingsPath=path.join(CONTENT,'site.json');
if(fs.existsSync(settingsPath)) siteSettings=JSON.parse(read(settingsPath));

const indexPath=path.join(DIST,'index.html');
let index=read(indexPath);
index=replaceAll(index,'<div id="todayGrid" class="grid-3"></div>',blogs.slice(0,3).map(cardBlog).join('')||'<p>No blogs published yet.</p>');
write(indexPath,index);

const aboutPath=path.join(DIST,'about.html');
let about=read(aboutPath);
about=replaceAll(about,'<p class="lead">Watch the video to see the design and making journey. The video is embedded from the YouTube link supplied for this website.</p>',`<p class="lead">${esc(siteSettings.video_intro||'Watch the video to see the design and making journey.')}</p>`);
about=replaceAll(about,'<div class="video-wrap"><iframe src="https://www.youtube.com/embed/kETDukCmJEM" title="How our suits are designed and made at Shiv Saree Emporium" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>',`<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${esc(siteSettings.youtube_video_id||'kETDukCmJEM')}" title="${esc(siteSettings.video_title||'How our suits are designed and made at Shiv Saree Emporium')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
about=replaceAll(about,'<p>Our suit-making journey brings together design planning, fabric selection, embroidery and finishing. Each stage contributes to the final look, comfort and presentation of the suit.</p><p>Use this section for your final approved video description and manufacturing details as your content becomes available.</p>',String(siteSettings.supporting_text||'').split(/\n\s*\n/).filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join(''));
about=replaceAll(about,'<p class="small">A full transcript was not supplied in the materials available for this build. Add your approved transcript through the content panel or replace this text with the exact transcript before publishing.</p>',`<p class="small">${esc(siteSettings.transcript||'')}</p>`);
const videoSchema={"@context":"https://schema.org","@type":"VideoObject","name":siteSettings.video_title||"How Our Suits Are Designed and Made | Shiv Saree Emporium","description":siteSettings.video_description||"See how suits are designed and made at Shiv Saree Emporium in Chandni Chowk.","embedUrl":`https://www.youtube.com/embed/${siteSettings.youtube_video_id||'kETDukCmJEM'}`,"uploadDate":siteSettings.video_upload_date||undefined};
if(videoSchema.uploadDate===undefined) delete videoSchema.uploadDate;
about=about.replace('</head>',`<script type="application/ld+json">${JSON.stringify(videoSchema)}</script></head>`);
write(aboutPath,about);

const colPath=path.join(DIST,'collections.html');
let col=read(colPath);
col=replaceAll(col,'<div id="collectionGrid" class="grid-3"></div>',collections.map(cardCollection).join('')||'<p>No suits published yet.</p>');
write(colPath,col);

const blogPath=path.join(DIST,'blog.html');
let blog=read(blogPath);
blog=replaceAll(blog,'<div id="todayGrid" class="grid-3"></div>',blogs.slice(0,3).map(cardBlog).join('')||'<p>No blogs published yet.</p>');
blog=replaceAll(blog,'<div id="blogGrid" class="grid-3"></div>',blogs.map(cardBlog).join('')||'<p>No blogs published yet.</p>');
write(blogPath,blog);

const todayPath=path.join(DIST,'today-blog.html');
let today=read(todayPath);
today=replaceAll(today,'<div id="todayGrid" class="grid-3"></div>',blogs.slice(0,3).map(cardBlog).join('')||'<p>No blogs published yet.</p>');
write(todayPath,today);

const allPath=path.join(DIST,'all-blogs.html');
let all=read(allPath);
all=replaceAll(all,'<div id="blogGrid" class="grid-3"></div>',blogs.map(cardBlog).join('')||'<p>No blogs published yet.</p>');
write(allPath,all);

for(const b of blogs){
  const dir=path.join(DIST,'blog',b.slug); mkdir(dir);
  const source=read(path.join(TEMPLATES,'blog.html'));
  let html=source;
  const canonical=`${BASE}/blog/${b.slug}/`;
  html=replaceAll(html,'{{TITLE}}',esc(b.title||'Blog Article'));
  html=replaceAll(html,'{{DESCRIPTION}}',esc(b.description||b.excerpt||''));
  html=replaceAll(html,'{{CANONICAL}}',canonical);
  html=replaceAll(html,'{{CATEGORY}}',esc(b.category||'General'));
  html=replaceAll(html,'{{DATE}}',esc(b.date||''));
  html=replaceAll(html,'{{BODY}}',markdownToHtml(b.body));
  html=replaceAll(html,'{{FEATURED_IMAGE}}',b.featured_image?`<img class="blog-featured" src="${esc(b.featured_image)}" alt="${esc(b.alt_text||b.title||'')}" width="1200" height="800" fetchpriority="high">`:'' );
  const schema={"@context":"https://schema.org","@type":"Article","headline":b.title||'Blog Article',"description":b.description||b.excerpt||'',"datePublished":b.date||undefined,"dateModified":b.date||undefined,"mainEntityOfPage":{"@type":"WebPage","@id":canonical},"author":{"@type":"Organization","name":"Shiv Saree Emporium"},"publisher":{"@type":"Organization","name":"Shiv Saree Emporium","url":BASE}};
  Object.keys(schema).forEach(k=>schema[k]===undefined&&delete schema[k]);
  html=replaceAll(html,'{{SCHEMA}}',JSON.stringify(schema));
  write(path.join(dir,'index.html'),html);
}

// Remove client-side demo CMS script from generated public pages.
function stripSiteJs(file){
  if(!fs.existsSync(file)) return;
  let s=read(file).replace(/\n?<script src="assets\/site\.js" defer><\/script>/g,'');
  write(file,s);
}
for(const f of ['index.html','about.html','collections.html','blog.html','today-blog.html','all-blogs.html','contact.html']) stripSiteJs(path.join(DIST,f));

// Generate a sitemap containing only public pages and published blog URLs.
const urls=['/','/about.html','/collections.html','/blog.html','/today-blog.html','/all-blogs.html','/contact.html',...blogs.map(b=>`/blog/${b.slug}/`)];
const now=new Date().toISOString().slice(0,10);
write(path.join(DIST,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>`  <url><loc>${BASE}${u}</loc><lastmod>${now}</lastmod></url>`).join('\n')+'\n</urlset>\n');

console.log(`Built ${blogs.length} blog(s) and ${collections.length} collection(s) into dist/`);
