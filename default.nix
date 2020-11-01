{ pkgs ? import <nixpkgs> {} }:

with pkgs;
let electron = pkgs.electron_11 or pkgs.electron_10 or pkgs.electron; in
mkYarnPackage rec {
    pname = "vieb";
    version = "3.0";

    src = ./.;

    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnFlags = [ "--production" ];

    nativeBuildInputs = [ makeWrapper ];

    desktopItem = makeDesktopItem {
        name = "vieb";
        exec = "vieb %U";
        icon = "vieb";
        desktopName = "Web Browser";
        genericName = "Web Browser";
        categories = "Network;WebBrowser;";
        mimeType = lib.concatStringsSep ";" [
            "text/html"
            "application/xhtml+xml"
            "x-scheme-handler/http"
            "x-scheme-handler/https"
        ];
    };

    postInstall = ''
        install -Dm0644 {${desktopItem},$out}/share/applications/vieb.desktop

        pushd $out/libexec/vieb/node_modules/vieb/app/img/icons
        for file in *.png; do
            install -Dm0644 $file $out/share/icons/hicolor/''${file//.png}/apps/vieb.png
        done
        popd

        makeWrapper ${electron}/bin/electron $out/bin/vieb \
            --add-flags $out/libexec/vieb/node_modules/vieb/app
    '';
}
