import { DataTypes, Model, Sequelize } from 'sequelize';

interface Participant {
  name: string;
  email: string;
  phone: string;
}

export default (sequelize: Sequelize) => {
  class Event extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public date!: Date;
    public time!: string;
    public location?: string;
    public link!: string;
    public benefits!: string;
    public faq?: string;
    public price?: number;
    public images?: string[];
    public type!: 'presencial' | 'hibrido';
    public participants?: Participant[];
    public maxPresentialParticipants?: number;
  }

  Event.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      benefits: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      faq: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },

      type: {
        type: DataTypes.ENUM('presencial', 'hibrido'),
        allowNull: false,
        defaultValue: 'presencial',
      },

      participants: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: true,
        defaultValue: [],
      },

      maxPresentialParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: true,
    }
  );

  return Event;
};