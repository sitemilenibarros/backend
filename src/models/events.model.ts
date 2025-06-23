import { DataTypes, Model, Sequelize } from 'sequelize';

interface Faq {
  question: string;
  answer: string;
}

interface Participant {
  name: string;
  email: string;
  phone: string;
}

export default (sequelize: Sequelize) => {
  class EventsPage extends Model {
    public id!: number;
    public title!: string;
    public subtitle!: string;
    public description!: string;

    // payment
    public price?: number;
    public stripePriceId?: string;

    // registration control
    public type!: 'presencial' | 'hibrido';
    public maxPresentialParticipants?: number;
    public participants?: Participant[];

    // page images (up to 10)
    public images?: string[];

    // optional content
    public objectives?: string[];
    public targetAudience?: string[];
    public methods?: Record<string, any>;
    public eventDate?: string;      // YYYY-MM-DD
    public startTime?: string;      // HH:MM:SS
    public endTime?: string;        // HH:MM:SS
    public breakDuration?: number;  // in minutes
    public formats?: string[];
    public location?: string;
    public onlineLink?: string;
    public materials?: string[];
    public limitedSeats?: boolean;
    public bonuses?: string[];
    public faqs?: Faq[];
    public ctaText?: string;
    public ctaUrl?: string;
  }

  EventsPage.init(
    {
      // required
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subtitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // pricing
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stripePriceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // event & registration
      type: {
        type: DataTypes.ENUM('presencial', 'hibrido'),
        allowNull: false,
        defaultValue: 'presencial',
      },
      maxPresentialParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      participants: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: true,
        defaultValue: [],
      },

      // up to 10 images for the page
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        validate: {
          maxImages(value: string[]) {
            if (value.length > 10) {
              throw new Error('You can specify up to 10 images only.');
            }
          }
        }
      },

      // optional descriptive fields
      objectives: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      targetAudience: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      methods: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      breakDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      formats: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      onlineLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      materials: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      limitedSeats: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      bonuses: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      faqs: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: true,
        defaultValue: [],
      },
      ctaText: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ctaUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'EventsPage',
      tableName: 'events_pages',
      timestamps: true,
    }
  );

  return EventsPage;
};
