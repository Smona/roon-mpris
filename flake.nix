{
  description = "Control Roon from your MPRIS-based Linux desktop";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      linuxSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = f: nixpkgs.lib.genAttrs linuxSystems (system: f {
        pkgs = nixpkgs.legacyPackages.${system};
        inherit system;
      });
    in
    {
      packages = forAllSystems ({ pkgs, ... }: {
        roon-mpris = pkgs.callPackage ./default.nix {};
        default = self.packages.${pkgs.system}.roon-mpris;
      });
    };
}
