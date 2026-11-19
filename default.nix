{ pkgs }:
pkgs.buildNpmPackage {
  pname = "sippin-diesel";
  version = "0.1.0";
  src = pkgs.lib.cleanSource ./.;
  nodejs = pkgs.nodejs_24;
  npmDepsHash = pkgs.lib.fakeHash;
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
