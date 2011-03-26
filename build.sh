#!/bin/sh

# Clear the way!
rm -rf ~/sites/radiationinfo
cp -r ~/repos/radiationinfo ~/sites/
rm -rf ~/sites/radiationinfo/.git
rm ~/sites/radiationinfo/build.sh
rm ~/sites/radiationinfo/README.md

# Prep source data
wget -O ~/sites/radiationinfo/_src/acute.tsv 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=1'
wget -O ~/sites/radiationinfo/_src/longterm.tsv 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=0'
wget -O ~/sites/radiationinfo/_src/limits.tsv 'https://spreadsheets.google.com/fm?key=0ApnSRONV3LTVdEpxelZFMlFoTHlkWEgtZ3NiMHN2RlE&hl=en&fmcmd=23&gid=2'

node ~/sites/radiationinfo/_src/tojson.js acute > ~/sites/radiationinfo/_src/acute.json
node ~/sites/radiationinfo/_src/tojson.js longterm > ~/sites/radiationinfo/_src/longterm.json
node ~/sites/radiationinfo/_src/tojson.js limits > ~/sites/radiationinfo/_src/limits.json
cat ~/sites/radiationinfo/_src/*.json > ~/sites/radiationinfo/_js/data.js

rm -rf ~/sites/radiationinfo/_src

# Handle CSS
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_css/reset.css -o ~/sites/radiationinfo/_css/reset.css
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_css/screen.css -o ~/sites/radiationinfo/_css/screen.css
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_css/ie.css -o ~/sites/radiationinfo/_css/ie.css
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_css/320.css -o ~/sites/radiationinfo/_css/320.css
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_css/radiation.css -o ~/sites/radiationinfo/_css/radiation.css
touch ~/sites/radiationinfo/_css/all.css
cat ~/sites/radiationinfo/_css/reset.css ~/sites/radiationinfo/_css/screen.css > ~/sites/radiationinfo/_css/all.css
rm ~/sites/radiationinfo/_css/reset.css ~/sites/radiationinfo/_css/screen.css

# Handle JS
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_js/data.js -o ~/sites/radiationinfo/_js/data.js
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_js/usepie.js -o ~/sites/radiationinfo/_js/usepie.js
java -jar ~/devtools/yuicompressor-2.4.2.jar ~/sites/radiationinfo/_js/site.js -o ~/sites/radiationinfo/_js/site.js
cp ~/sites/radiationinfo/_js/site.js ~/sites/radiationinfo/_js/embed.js

# Set up hosts

case $1 in
    local)
		#### LOCAL SETUP ####
		# {{   }} http://localhost/
		perl -p -i -e 's/{{([\w]*)}}/http:\/\/localhost\//g' ~/sites/radiationinfo/index.html ~/sites/radiationinfo/_css/* ~/sites/radiationinfo/_js/*;
		
		# Remove Google Analytics
		touch ~/sites/radiationinfo/temp.html
		awk '/DOCTYPE/,/<\!\-\-Begin Google Analytics\-\->/' ~/sites/radiationinfo/index.html >> ~/sites/radiationinfo/temp.html
		awk '/<\!\-\-End Google Analytics\-\->/,/<\/html>/' ~/sites/radiationinfo/index.html >> ~/sites/radiationinfo/temp.html
		rm ~/sites/radiationinfo/index.html
		mv ~/sites/radiationinfo/temp.html ~/sites/radiationinfo/index.html
        ;;
    remote)
		#### REMOTE SETUP ####
		# {{HOST}} http://www.radiationinfo.org/
		# {{CDN}} http://cdn.radiationinfo.org/
		# {{CSS}} http://cdn.radiationinfo.org/
		# {{IMAGE}} http://cdn.radiationinfo.org/
		# {{JS}} http://cdn.radiationinfo.org/

		perl -p -i -e 's/{{HOST}}/http:\/\/www\.radiationinfo\.org\//g' ~/sites/radiationinfo/index.html ~/sites/radiationinfo/_css/* ~/sites/radiationinfo/_js/*;
		perl -p -i -e 's/{{([\w]*)}}/http:\/\/cdn\.radiationinfo\.org\//g' ~/sites/radiationinfo/index.html ~/sites/radiationinfo/_css/* ~/sites/radiationinfo/_js/*;
        ;;
    *)
        echo $0 "local | remote"
        ;;
esac