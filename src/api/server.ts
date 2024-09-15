import express from 'express';
import cors from 'cors';
import { Config } from '../config/config';
import { Database, Question } from '../database/database';

export class ApiServer {
  private app: express.Application;
  private database: Database;

  constructor(config: Config) {
    this.app = express();
    this.database = new Database(config);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Enable CORS for all routes
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Add logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/api/questions', this.getQuestions.bind(this));
    this.app.get('/api/questions/:id', this.getQuestion.bind(this));
    this.app.post('/api/questions', this.addQuestion.bind(this));
    this.app.put('/api/questions/:id', this.updateQuestion.bind(this));
    this.app.delete('/api/questions/:id', this.deleteQuestion.bind(this));
  }

  private async getQuestions(req: express.Request, res: express.Response) {
    try {
      const questions = await this.database.getAllQuestions();
      console.log('Fetched questions:', questions);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }

  private async getQuestion(req: express.Request, res: express.Response) {
    try {
      const question = await this.database.getQuestion(parseInt(req.params.id));
      if (question) {
        console.log('Fetched question:', question);
        res.json(question);
      } else {
        res.status(404).json({ error: 'Question not found' });
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
    }
  }

  private async addQuestion(req: express.Request, res: express.Response) {
    try {
      const { question_text, answers, correct_answers, day } = req.body;
      if (!Array.isArray(answers) || !Array.isArray(correct_answers)) {
        return res.status(400).json({ error: 'Answers and correct_answers must be arrays' });
      }
      const formattedDay = this.formatDate(day);
      await this.database.addQuestion(question_text, answers, correct_answers, formattedDay);
      console.log('Added question:', { question_text, answers, correct_answers, day: formattedDay });
      res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ error: 'Failed to add question' });
    }
  }

  private async updateQuestion(req: express.Request, res: express.Response) {
    try {
      const { question_text, answers, correct_answers, day } = req.body;
      if (!Array.isArray(answers) || !Array.isArray(correct_answers)) {
        return res.status(400).json({ error: 'Answers and correct_answers must be arrays' });
      }
      const formattedDay = this.formatDate(day);
      await this.database.updateQuestion(parseInt(req.params.id), question_text, answers, correct_answers, formattedDay);
      console.log('Updated question:', { id: req.params.id, question_text, answers, correct_answers, day: formattedDay });
      res.json({ message: 'Question updated successfully' });
    } catch (error) {
      console.error('Error updating question:', error);
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        res.status(409).json({ error: 'A question for this day already exists. Please choose a different day.' });
      } else {
        res.status(500).json({ error: 'Failed to update question' });
      }
    }
  }

  private async deleteQuestion(req: express.Request, res: express.Response) {
    try {
      await this.database.deleteQuestion(parseInt(req.params.id));
      console.log('Deleted question:', req.params.id);
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // This will return 'YYYY-MM-DD'
  }

  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`API server listening on port ${port}`);
    });
  }
}