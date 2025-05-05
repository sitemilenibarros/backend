import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

// Modelo de Curso
class Course extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public price!: number;
  public imageUrl?: string;
}

Course.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Course',
    tableName: 'courses',
    timestamps: true,
  }
);

export default Course;
