const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));


const token = process.env.GITHUB_TOKEN;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.get('/', (req, res) => {
    res.send(`<h2 style ="color : red"> Server is running</h2>`);
});

app.post('/files', async (req, res) => {
    try {
        const { owner, repo } = req.body;
        const path = '';
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const files = response.data.map(file => file.name);
        res.json({ files });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

app.post('/generate-summary', async (req, res) => {
    const { files, owner, repo } = req.body;
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${files}`
    const prompt =
        `give list of test case genarate summary in a defined JSON format.
JSON Format:{
            "topic":<topic1> (<filename1>),
            "description":<summary of the code>
            "input":<input>,
            "output":<output>,
            "language":<language>,
            "code":<file>

        },
        {
            "topic":<topic2> (<filename1>),
            "description":<summary of the code>
            "input":<input>,
            "output":<output>,
            "language":<language>,
            "code":<file>

        },
          {
            "topic":<topic1> (<filename2>),
            "description":<summary of the code>
            "input":<input>,
            "output":<output>,
            "language":<language>,
            "code":<file>

        },
        {
            "topic":<topic2> (<filename2>),
            "description":<summary of the code>
            "input":<input>,
            "output":<output>,
            "language":<language>,
            "code":<file>

        },
          
       
             for following files:
    //${url}//
    // 
    Response:
    `;

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
        const response = await result.response;
        const text = response.text();
        const jdata = JSON.parse(text);
        res.send({ summaries: jdata });
    }
    catch (error) {
        console.error('Gemini API error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate summary' });
    }
}
);

app.post('/generate-code', async (req, res) => {
    const { summary } = req.body;
    const prompt = `You are an expert software tester and developer.
I will give you a JSON object containing details of a test case including:

topic: The main title or purpose of the test

description: Full explanation of what the test covers

input: The input data for the test

output: The expected output of the test

language: The programming language to use for the test script

code: The relevant implementation code to be tested

Your task:

Write a complete, runnable test script in the given language to verify the described test case.

Ensure the test includes assertions to check that the actual output matches the expected output.

Keep the code well-formatted and with explanatory comments.

Do not modify the original function implementation unless needed for testing.

Here is the JSON object:
//${JSON.stringify({ summary }, null, 2)}//
`
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ generatedCode: text });
}
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});