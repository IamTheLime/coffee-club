{ pkgs }:
pkgs.buildNpmPackage {
  pname = "sippin-diesel";
  version = "0.1.0";
  src = pkgs.lib.cleanSourceWith {
    src = ./.;
    filter = path: type: let name = baseNameOf path; in
      !(builtins.elem name [ ".git" ".data" "node_modules" "dist" "import-extract.txt" ])
      && !(pkgs.lib.hasPrefix ".env" name)
      && !(pkgs.lib.hasSuffix ".sqlite" name);
  };
  nodejs = pkgs.nodejs_24;
  npmDepsHash = "sha256-SPN3dHW5Lwg/B521zojVmn336C6bxafrzNJbAwmkOhQ=";
  nativeBuildInputs = [ pkgs.makeWrapper ];
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/coffee-club $out/bin
    cp -r dist server node_modules package.json $out/lib/coffee-club/
    makeWrapper ${pkgs.nodejs_24}/bin/node $out/bin/sippin-diesel \
      --add-flags "$out/lib/coffee-club/server/start.mjs"
    runHook postInstall
  '';
}
