{
  lib,
  buildNpmPackage,
  fetchFromGitHub,
}:

buildNpmPackage (finalAttrs: {
  pname = "roon-mpris";
  version = "a54df5ac137fb82935d156942f57486417abc9da";

  src = fetchFromGitHub {
    owner = "Smona";
    repo = "roon-mpris";
    rev = finalAttrs.version;
    hash = "sha256-mI1E4MDdGBfP22E7OcnbUHnxJ8xnC1UBqi+xpulBBUE=";
  };

  npmDepsHash = "sha256-+5EOMO0OgnFS9nJvyJR+cfBBjLb2rsW33ahKwVtT6fk=";

  # The prepack script runs the build script, which we'd rather do in the build phase.
  npmPackFlags = [ "--ignore-scripts" ];

  makeCacheWritable = true;
  dontNpmBuild = true;

  meta = {
    description = "A script that allows you to control roon from your MPRIS based linux desktop";
    homepage = "https://github.com/Smona/roon-mpris";
    license = lib.licenses.gpl3Only;
    maintainers = with lib.maintainers; [ Smona ];
  };
})
