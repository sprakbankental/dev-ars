# SBTal repo documentation

Documentation should be built and commited before 
each stable and each development release.

To build, start by checking the `repoversion` attribute
in `/docs/asciidoc/attributes/config.adoc` - it should
be set to the version you're about to release. If it 
isn't, set it commit and push.

In this directory (`/docs`), execute 

```
docker run -ir -v "$PWD":/adoc --rm sprakbankental/os bash
cd /adoc/asciidocs
adocs *.adoc
adocs-pdf *.adoc
exit
```

This will build HTML version in `/docs/html/` and PDF 
versions in `/docs/pdf/`. 

Commit and push the documents, and you're done.

There is ususally no need to commit documentaiton between 
releases. You can build them locally following the 
instruction above, to see what your updates look like, 
but it is sufficient to check in the files in 
`/docs/adocs/` and leave the HTML and PDF checkins to
the moments before the next new release.

