{
	description = "hcload - Upload files to the Hack club CDN via Deno and your CLI";
	inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

	outputs = { self, nixpkgs }:
		let pkgs = nixpkgs.legacyPackages.x86_64-linux;
		in {
			devShell.x86_64-linux = pkgs.mkShell {
				buildInputs = with pkgs; [
					deno
				];
			};
		};
}
