var fs = require('fs');

function buildJSON(string) {
	string = string.replace(/\"/g, '');
	var rows = string.split('\n');

	// Mmm, computer version.
	var headers = rows.shift();
	headers = headers.split("\t");

	var results = [];
	var temp;

	for (var i = 0; i < rows.length; i++) {
		temp = {};

		rows[i] = rows[i].split('\t');
		// rows[i] is an array of cells.

		for (var j = 0; j < rows[i].length; j++) {
			// rows[i][j] is a particular cell's value.
			temp[headers[j]] = rows[i][j];

		}
		results.push(temp);
	}

	return JSON.stringify(results);
}


fs.readFile(process.cwd().replace('Repos','sites')+'/_src/'+process.argv[2]+'.tsv', 'utf8', function (err, res) {
	console.log('var ' + process.argv[2] + ' = ' + buildJSON(res) + ';');
});