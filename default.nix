{
  pkgs ? import <nixpkgs> {},
}:

pkgs.buildNpmPackage (finalAttrs: {
  pname = "roon-mpris";
  version = "1.0.0";

  src = ./.;

  npmDepsHash = "sha256-+5EOMO0OgnFS9nJvyJR+cfBBjLb2rsW33ahKwVtT6fk=";

  # The prepack script runs the build script, which we'd rather do in the build phase.
  npmPackFlags = [ "--ignore-scripts" ];

  makeCacheWritable = true;
  dontNpmBuild = true;
})
