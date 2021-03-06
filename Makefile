BIN=fireworqonsole
BUILD_OUTPUT=.
TEST_OUTPUT=.
GO=go
PRERELEASE=SNAPSHOT
BUILD=$$(git describe --always)
NODE=http://127.0.0.1:8080
BIND=0.0.0.0:8888
export GO111MODULE=on

.PHONY: all
all: clean build

.PHONY: build
build: generate
	npm install
	npm run build
	GOOS= GOARCH= go-assets-builder -p assets -s /assets -o assets/assets.go assets
	${GO} build -ldflags "-X main.Build=$(BUILD) -X main.Prerelease=DEBUG" -o ${BUILD_OUTPUT}/$(BIN) .

.PHONY: release
release: npmbuild deps credits generate
	GOOS= GOARCH= go-assets-builder -p assets -s /assets -o assets/assets.go assets
	CGO_ENABLED=0 ${GO} build -ldflags "-X main.Build=$(BUILD) -X main.Prerelease=$(PRERELEASE)" -o ${BUILD_OUTPUT}/$(BIN) .

.PHONY: run
run: build
	npm run dev & ./${BIN} --bind=${BIND} --node=${NODE} --debug & wait

.PHONY: deps
deps:
	GO111MODULE=off GOOS= GOARCH= ${GO} get github.com/jessevdk/go-assets-builder

.PHONY: npmbuild
npmbuild:
	npm install
	npm run build:prod
	npm prune --production

.PHONY: credits
credits:
	GOOS= GOARCH= ${GO} run script/genauthors/genauthors.go > AUTHORS
	GO111MODULE=off GOOS= GOARCH= ${GO} get github.com/Songmu/gocredits/cmd/gocredits
	gocredits -json | jq -r '.Licenses|map({"package":.Name,"url":.URL,"license":.Content})' > CREDITS.go.json
	script/credits-npm > CREDITS.npm.json

.PHONY: generate
generate: deps
	touch AUTHORS
	touch CREDITS.go.json CREDITS.npm.json
	GOOS= GOARCH= ${GO} generate -x ./...

.PHONY: clean
clean:
	rm -f assets/assets.go assets.go CREDITS.go.json CREDITS.npm.json
	rm -f $(BIN)
	${GO} clean || true
