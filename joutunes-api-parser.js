var GreenhouseIO = require('./greenhouseioAPI');
var he = require('he');
var html2json = require('html2json').html2json;

var gh = GreenhouseIO('joytunes', '');

function getJsonFromHtml(str) {
	return html2json(he.decode(str));
}

function parseMain(arr) {
	let result = '';
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].tag != 'p') continue;
		result += getText(arr[i]);
	}

	return result;
}

async function getAllDepartments() {
	return JSON.parse(await gh.request('departments')).departments;
}

async function getJobById(id) {
	return JSON.parse(await gh.request('jobs', { id: id }));
}

function createJob(jobJson, jobContent) {
	let elements = jobContent.child;
	elements.reverse();
	let sections = [];

	for (var i = 0; i < elements.length; i++) {
		if (isNoMoreUl(elements, i)) break;
		if (elements[i].tag != 'ul') continue;
		let bullets = parseUl(elements[i]);
		i += 2;
		let title = getText(elements[i]);
		sections.push({
			title: title,
			bullets: bullets,
		});
	}
	sections.reverse();

	let job = {};
	job.role_name = jobJson.title;
	job.description = {};
	job.description.main_text = parseMain(elements.slice(i).reverse());
	job.description.sections = sections;

	return job;
}

function isNoMoreUl(elements, index) {
	for (var i = index; i < elements.length; i++) {
		if (elements[i].tag == 'ul') {
			return false;
		}
	}
	return true;
}

function parseUl(obj) {
	let bullets = [];
	for (let i = 0; i < obj.child.length; i++) {
		if (obj.child[i].tag != 'li') continue;
		bullets.push(getText(obj.child[i]));
	}

	return bullets;
}

function getText(obj) {
	if (obj.child) return getText(obj.child[0]);
	return obj.text.replace(/(\r\n|\n|\r)/gm, '');
}

async function getJobs() {
	let jobs = {};

	const deps = await getAllDepartments().catch(function (err) {
		console.log(`ERROR:    ${err}`);
	});

	for (let depIndex = 0; depIndex < deps.length; depIndex++) {
		jobs[deps[depIndex].name] = [];

		for (let j = 0; j < deps[depIndex].jobs.length; j++) {
			let jobJson = deps[depIndex].jobs[j];
			let fullJob = await getJobById(jobJson.id);
			let jobContent = await getJsonFromHtml(fullJob.content);

			const job = createJob(jobJson, jobContent);
			jobs[deps[depIndex].name].push(job);
		}
	}

	return jobs;
}

let result;
(async () => {
	try {
		await GetJoyTunesJobs();
	} catch (e) {
		console.log(e);
	}
})();

async function GetJoyTunesJobs() {
	if (!result) result = await getJobs();

	return result;
}
module.exports = exports = GetJoyTunesJobs;

