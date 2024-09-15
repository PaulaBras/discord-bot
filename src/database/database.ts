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
  private pool: mysql.Pool;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.pool = mysql.createPool(this.config.mysql);
  }

  async getConnection(): Promise<mysql.PoolConnection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Error getting database connection:', error);
      throw new Error('Database connection failed');
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.query(sql, params);
      return results;
    } finally {
      connection.release();
    }
  }

  async getDailyQuestion(): Promise<Question | null> {
    const rows = await this.query(
      'SELECT id, question_text, answers, correct_answers, day FROM questions WHERE day = CURDATE()'
    );

    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        answers: JSON.parse(row.answers),
        correct_answers: JSON.parse(row.correct_answers)
      } as Question;
    }

    return null;
  }

  async saveUserAnswers(userId: string, questionId: number, answers: string[]): Promise<void> {
    const answersJson = JSON.stringify(answers);
    await this.query(
      'INSERT INTO user_answers (user_id, question_id, answers) VALUES (?, ?, ?)',
      [userId, questionId, answersJson]
    );
  }

  async hasUserAnsweredToday(userId: string): Promise<boolean> {
    const rows = await this.query(
      `SELECT COUNT(*) as count FROM user_answers
       JOIN questions ON user_answers.question_id = questions.id
       WHERE user_answers.user_id = ? AND questions.day = CURDATE()`,
      [userId]
    );

    return rows[0].count > 0;
  }

  async getAllQuestions(): Promise<Question[]> {
    const rows = await this.query('SELECT * FROM questions ORDER BY day DESC');
    return rows.map((row: any) => ({
      ...row,
      answers: JSON.parse(row.answers),
      correct_answers: JSON.parse(row.correct_answers)
    }));
  }

  async getQuestion(id: number): Promise<Question | null> {
    const rows = await this.query('SELECT * FROM questions WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        answers: JSON.parse(row.answers),
        correct_answers: JSON.parse(row.correct_answers)
      } as Question;
    }

    return null;
  }

  async addQuestion(question_text: string, answers: string[], correct_answers: string[], day: string): Promise<void> {
    const answersJson = JSON.stringify(answers);
    const correctAnswersJson = JSON.stringify(correct_answers);
    const formattedDay = this.formatDate(day);

    await this.query(
      'INSERT INTO questions (question_text, answers, correct_answers, day) VALUES (?, ?, ?, ?)',
      [question_text, answersJson, correctAnswersJson, formattedDay]
    );
  }

  async updateQuestion(id: number, question_text: string, answers: string[], correct_answers: string[], day: string): Promise<void> {
    const answersJson = JSON.stringify(answers);
    const correctAnswersJson = JSON.stringify(correct_answers);
    const formattedDay = this.formatDate(day);

    const currentQuestion = await this.getQuestion(id);
    if (!currentQuestion) {
      throw new Error('Question not found');
    }

    let sql = 'UPDATE questions SET question_text = ?, answers = ?, correct_answers = ?';
    const params: any[] = [question_text, answersJson, correctAnswersJson];

    if (currentQuestion.day !== formattedDay) {
      sql += ', day = ?';
      params.push(formattedDay);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await this.query(sql, params);
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.query('DELETE FROM questions WHERE id = ?', [id]);
  }

  async updateScoreboard(userId: string, username: string, points: number): Promise<void> {
    await this.query(
      `INSERT INTO scoreboard (user_id, username, score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       score = score + VALUES(score)`,
      [userId, username, points]
    );
  }

  async getTopScoreboard(limit: number = 10): Promise<Array<{userId: string, username: string, score: number}>> {
    return await this.query(
      'SELECT user_id, username, score FROM scoreboard ORDER BY score DESC LIMIT ?',
      [limit]
    );
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // This will return 'YYYY-MM-DD'
  }
}