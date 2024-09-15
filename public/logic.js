const API_URL = 'http://localhost:3000/api';
let allQuestions = [];
let currentPage = 1;
const questionsPerPage = 5;

async function fetchQuestions() {
    try {
        const response = await fetch(`${API_URL}/questions`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestions = await response.json();
        // Sort questions by day
        allQuestions.sort((a, b) => new Date(b.day) - new Date(a.day));
        updateQuestionTable();
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to fetch questions. Please try again.');
    }
}

function updateQuestionTable() {
    const tbody = document.querySelector('#questionTable tbody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex);

    paginatedQuestions.forEach(q => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${q.question_text}</td>
            <td>${createAnswerList(q.answers, q.id, q.correct_answers)}</td>
            <td>${formatDate(q.day)}</td>
            <td>
                <button onclick="editQuestion(${q.id})">Edit</button>
                <button onclick="deleteQuestion(${q.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(allQuestions.length);
}

function createAnswerList(answers, questionId, correctAnswers) {
    return `<ul class="answer-list">${answers.map((answer, index) => 
        `<li class="answer-item">
            ${answer}
            <button class="correct-btn ${correctAnswers.includes(answer) ? 'correct' : 'incorrect'}" 
                    onclick="toggleCorrectAnswer(${questionId}, ${index})">
                ${correctAnswers.includes(answer) ? 'Correct' : 'Incorrect'}
            </button>
        </li>`
    ).join('')}</ul>`;
}

async function addOrUpdateQuestion(event) {
    event.preventDefault();
    console.log('addOrUpdateQuestion function called');
    const id = document.getElementById('questionId').value;
    const question_text = document.getElementById('questionText').value;
    const answerItems = document.querySelectorAll('.answer-item');
    const answers = [];
    const correct_answers = [];
    answerItems.forEach((item, index) => {
        const answerInput = item.querySelector('.answer-input');
        const correctBtn = item.querySelector('.correct-btn');
        if (answerInput && correctBtn) {
            const answerText = answerInput.value;
            answers.push(answerText);
            if (correctBtn.classList.contains('correct')) {
                correct_answers.push(answerText);
            }
        } else {
            console.error(`Missing answer input or correct button for item ${index + 1}`);
        }
    });
    const day = document.getElementById('day').value;

    console.log('Question data:', { id, question_text, answers, correct_answers, day });
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/questions/${id}` : `${API_URL}/questions`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question_text, answers, correct_answers, day })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                throw new Error(errorData.error);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        document.getElementById('questionForm').reset();
        document.getElementById('questionId').value = '';
        document.getElementById('answerList').innerHTML = `
            <div class="answer-item">
                <input type="text" class="answer-input" placeholder="Answer 1" required>
                <button type="button" class="correct-btn incorrect" onclick="toggleAnswerCorrect(this)">Incorrect</button>
                <button type="button" class="remove-btn" onclick="removeAnswerInput(this)">Remove</button>
            </div>
        `;
        setDefaultDate();
        await fetchQuestions();
        alert(id ? 'Question updated successfully!' : 'Question added successfully!');
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('A question for this day already exists')) {
            alert('A question for this day already exists. Please choose a different day.');
        } else {
            alert('An error occurred while saving the question. Please try again.');
        }
    }
}

async function editQuestion(id) {
    const question = allQuestions.find(q => q.id === id);
    document.getElementById('questionId').value = question.id;
    document.getElementById('questionText').value = question.question_text;
    document.getElementById('answerList').innerHTML = question.answers.map((answer, index) => 
        `<div class="answer-item">
            <input type="text" class="answer-input" placeholder="Answer ${index + 1}" value="${answer}" required>
            <button type="button" class="correct-btn ${question.correct_answers.includes(answer) ? 'correct' : 'incorrect'}" 
                    onclick="toggleAnswerCorrect(this)">
                ${question.correct_answers.includes(answer) ? 'Correct' : 'Incorrect'}
            </button>
            <button type="button" class="remove-btn" onclick="removeAnswerInput(this)">Remove</button>
        </div>`
    ).join('');
    // Format the date to YYYY-MM-DD for the input field
    const formattedDate = new Date(question.day).toISOString().split('T')[0];
    document.getElementById('day').value = formattedDate;
}

async function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            const response = await fetch(`${API_URL}/questions/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            await fetchQuestions();
            alert('Question deleted successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while deleting the question. Please try again.');
        }
    }
}

async function toggleCorrectAnswer(questionId, answerIndex) {
    const question = allQuestions.find(q => q.id === questionId);
    const answer = question.answers[answerIndex];
    const isCorrect = !question.correct_answers.includes(answer);
    
    if (isCorrect) {
        question.correct_answers.push(answer);
    } else {
        question.correct_answers = question.correct_answers.filter(a => a !== answer);
    }

    try {
        const response = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchQuestions();
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating the answer status. Please try again.');
    }
}

function toggleAnswerCorrect(button) {
    if (button.classList.contains('correct')) {
        button.classList.remove('correct');
        button.classList.add('incorrect');
        button.textContent = 'Incorrect';
    } else {
        button.classList.remove('incorrect');
        button.classList.add('correct');
        button.textContent = 'Correct';
    }
}

function addAnswerInput() {
    const answerList = document.getElementById('answerList');
    const newAnswerItem = document.createElement('div');
    newAnswerItem.className = 'answer-item';
    newAnswerItem.innerHTML = `
        <input type="text" class="answer-input" placeholder="Answer ${answerList.children.length + 1}" required>
        <button type="button" class="correct-btn incorrect" onclick="toggleAnswerCorrect(this)">Incorrect</button>
        <button type="button" class="remove-btn" onclick="removeAnswerInput(this)">Remove</button>
    `;
    answerList.appendChild(newAnswerItem);
}

function removeAnswerInput(button) {
    const answerItem = button.closest('.answer-item');
    if (document.querySelectorAll('.answer-item').length > 1) {
        answerItem.remove();
    } else {
        alert('You must have at least one answer option.');
    }
}

function updatePagination(totalQuestions) {
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function setDefaultDate() {
    const today = new Date();
    document.getElementById('day').value = today.toISOString().split('T')[0];
}

document.getElementById('questionForm').addEventListener('submit', addOrUpdateQuestion);
document.getElementById('toggleQuestions').addEventListener('click', function() {
    const table = document.getElementById('questionTable');
    const button = document.getElementById('toggleQuestions');
    if (table.classList.contains('hidden')) {
        table.classList.remove('hidden');
        button.textContent = 'Hide Questions';
    } else {
        table.classList.add('hidden');
        button.textContent = 'Show Questions';
    }
});

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateQuestionTable();
    }
});
document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(allQuestions.length / questionsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateQuestionTable();
    }
});

// Set the default date to today when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDate();
    fetchQuestions();
});