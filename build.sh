#!/bin/sh

rm -rf ./build
mkdir ./build
mkdir ./build/_js
mkdir ./build/_css
mkdir ./build/_img

# Raw data as JSON.
curl --silent -L 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=1' | jq -s --slurp --raw-input --raw-output --compact-output -j 'split("\r\n") | .[1:-1] | map(split("\t")) | map({"description": .[0], "type": .[1], "level": .[2], "unit": .[3], "source": .[4]})' > ./build/_js/acute.json
curl --silent -L 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=0' | jq -s --slurp --raw-input --raw-output --compact-output -j 'split("\r\n") | .[1:-1] | map(split("\t")) | map({"description": .[0], "type": .[1], "level": .[2], "unit": .[3], "source": .[4]})' > ./build/_js/longterm.json
curl --silent -L 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=2' | jq -s --slurp --raw-input --raw-output --compact-output -j 'split("\r\n") | .[1:-1] | map(split("\t")) | map({"description": .[0], "type": .[1], "level": .[2], "unit": .[3], "source": .[4]})' > ./build/_js/limits.json

touch ./build/_js/data.js
printf "radiation.acute = " >> ./build/_js/data.js
cat ./build/_js/acute.json >> ./build/_js/data.js
printf ";" >> ./build/_js/data.js
printf "\nradiation.longterm = " >> ./build/_js/data.js
cat ./build/_js/longterm.json >> ./build/_js/data.js
printf ";" >> ./build/_js/data.js
printf "\nradiation.limits = " >> ./build/_js/data.js
cat ./build/_js/limits.json >> ./build/_js/data.js
printf ";" >> ./build/_js/data.js

wget --quiet https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-2.4.8.jar -O yuicompressor-2.4.8.jar

# Handle CSS
java -jar ./yuicompressor-2.4.8.jar ./_css/reset.css -o ./build/_css/reset.css
java -jar ./yuicompressor-2.4.8.jar ./_css/screen.css -o ./build/_css/screen.css
java -jar ./yuicompressor-2.4.8.jar ./_css/ie.css -o ./build/_css/ie.css
java -jar ./yuicompressor-2.4.8.jar ./_css/320.css -o ./build/_css/320.css
java -jar ./yuicompressor-2.4.8.jar ./_css/radiation.css -o ./build/_css/radiation.css
touch ./build/_css/all.css
cat ./build/_css/reset.css ./build/_css/screen.css > ./build/_css/all.css
cp ./_css/PIE.htc ./build/_css/

# Handle Images
cp ./_img/* ./build/_img/

# Handle favicon
cp ./favicon.ico ./build/

# Handle JS
java -jar ./yuicompressor-2.4.8.jar ./build/_js/data.js -o ./build/_js/data.js
java -jar ./yuicompressor-2.4.8.jar ./_js/usepie.js -o ./build/_js/usepie.js
java -jar ./yuicompressor-2.4.8.jar ./_js/site.js -o ./build/_js/site.js
touch ./build/_js/embed.js
cat ./build/_js/site.js ./build/_js/data.js > ./build/_js/embed.js
touch ./build/_js/all.js
cat ./_js/jquery.min.js ./_js/jquery-ui.min.js ./build/_js/site.js ./build/_js/data.js > ./build/_js/all.js
cp ./_js/PIE.js ./build/_js/

# Handle index.html
cp ./index.html ./build/

case $1 in
    local)
		#### LOCAL SETUP ####
		# {{   }} http://localhost:8000/
		perl -p -i -e 's/{{([\w]*)}}/http:\/\/localhost:8000\//g' ./build/index.html ./build/_css/* ./build/_js/*;
		
		# Remove Google Analytics
		touch ./build/temp.html
		awk '/DOCTYPE/,/<\!\-\-Begin Google Analytics\-\->/' ./build/index.html >> ./build/temp.html
		awk '/<\!\-\-End Google Analytics\-\->/,/<\/html>/' ./build/index.html >> ./build/temp.html
		rm ./build/index.html
		mv ./build/temp.html ./build/index.html
        ;;
    remote)
		#### REMOTE SETUP ####
		# {{HOST}} http://www.radiationinfo.org/
		# {{CDN}} http://cdn.radiationinfo.org/
		# {{CSS}} http://cdn.radiationinfo.org/
		# {{IMAGE}} http://cdn.radiationinfo.org/
		# {{JS}} http://cdn.radiationinfo.org/

		perl -p -i -e 's/{{HOST}}/https:\/\/www\.radiationinfo\.org\//g' ./build/index.html ./build/_css/* ./build/_js/*;
		perl -p -i -e 's/{{([\w]*)}}/https:\/\/cdn\.radiationinfo\.org\//g' ./build/index.html ./build/_css/* ./build/_js/*;
        ;;
    *)
        echo $0 "local | remote"
        ;;
esac