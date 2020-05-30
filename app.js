const express = require('express');
const app = express();
var GetJoyTunesJobs = require('./joutunes-api-parser');

app.use(express.json());
app.use(
	express.urlencoded({
		extended: false,
	})
);

app.get('/api/joytunes', async (req, res) => {
	let json = await GetJoyTunesJobs();
	res.status(200).json({ jobs: json });
});

app.use((req, res, next) => {
	const error = new Error('Not Found');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

module.exports = app;
