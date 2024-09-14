import mysql from 'mysql2/promise';
import { Config } from '../config/config';

export interface Question {
  id: number;
  question_text: string;
  answers: string[];
  correct_answers: string[];
  day: string;
}

export class Database {
  private connection: mysql.Connection | null = null;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.config.mysql);
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async getDailyQuestion(): Promise<Question | null> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const [rows] = await this.connection.execute(
      'SELECT id, question_text, answers, correct_answers, day FROM questions WHERE day = CURDATE()'
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as any;
      return {
        ...row,
        answers: JSON.parse(row.answers),
        correct_answers: JSON.parse(row.correct_answers)
      } as Question;
    }

    return null;
  }

  async saveUserAnswers(userId: string, questionId: number, answers: string[]): Promise<void> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const answersJson = JSON.stringify(answers);
    await this.connection.execute(
      'INSERT INTO user_answers (user_id, question_id, answers) VALUES (?, ?, ?)',
      [userId, questionId, answersJson]
    );
  }

  async hasUserAnsweredToday(userId: string): Promise<boolean> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const [rows] = await this.connection.execute(
      `SELECT COUNT(*) as count FROM user_answers
       JOIN questions ON user_answers.question_id = questions.id
       WHERE user_answers.user_id = ? AND questions.day = CURDATE()`,
      [userId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return (rows[0] as { count: number }).count > 0;
    }

    return false;
  }

  async getAllQuestions(): Promise<Question[]> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const [rows] = await this.connection.execute('SELECT * FROM questions ORDER BY day DESC');
    return (rows as any[]).map(row => ({
      ...row,
      answers: JSON.parse(row.answers),
      correct_answers: JSON.parse(row.correct_answers)
    }));
  }

  async getQuestion(id: number): Promise<Question | null> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const [rows] = await this.connection.execute('SELECT * FROM questions WHERE id = ?', [id]);
    
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as any;
      return {
        ...row,
        answers: JSON.parse(row.answers),
        correct_answers: JSON.parse(row.correct_answers)
      } as Question;
    }

    return null;
  }

  async addQuestion(question_text: string, answers: string[], correct_answers: string[], day: string): Promise<void> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const answersJson = JSON.stringify(answers);
    const correctAnswersJson = JSON.stringify(correct_answers);
    const formattedDay = this.formatDate(day);

    await this.connection.execute(
      'INSERT INTO questions (question_text, answers, correct_answers, day) VALUES (?, ?, ?, ?)',
      [question_text, answersJson, correctAnswersJson, formattedDay]
    );
  }

  async updateQuestion(id: number, question_text: string, answers: string[], correct_answers: string[], day: string): Promise<void> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    const answersJson = JSON.stringify(answers);
    const correctAnswersJson = JSON.stringify(correct_answers);
    const formattedDay = this.formatDate(day);

    await this.connection.execute(
      'UPDATE questions SET question_text = ?, answers = ?, correct_answers = ?, day = ? WHERE id = ?',
      [question_text, answersJson, correctAnswersJson, formattedDay, id]
    );
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.connect();
    if (!this.connection) throw new Error('Database connection failed');

    await this.connection.execute('DELETE FROM questions WHERE id = ?', [id]);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // This will return 'YYYY-MM-DD'
  }
}