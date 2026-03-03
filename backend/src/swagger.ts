import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NDECC Scheduler API',
      version: '2.5.0',
      description:
        'Lab booking system for dental education — 12-week cycle management, HubSpot CRM integration, and analytics.',
    },
    servers: [{ url: '/', description: 'Current server' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HttpOnly cookie. Obtain via POST /api/auth/login.',
        },
      },
      schemas: {
        // --- Prisma Models ---
        Lab: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Lab A' },
            labType: { type: 'string', enum: ['Regular', 'Pre-Exam'], example: 'Regular' },
          },
        },
        Station: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            labId: { type: 'integer' },
            number: { type: 'integer', example: 1 },
            side: { type: 'string', enum: ['LH', 'RH'], example: 'LH' },
          },
        },
        CycleWeek: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            cycleId: { type: 'integer' },
            week: { type: 'integer', minimum: 1, maximum: 12 },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Cycle: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Cycle 2026-1' },
            year: { type: 'integer', example: 2026 },
            number: { type: 'integer', example: 1 },
            locked: { type: 'boolean' },
            courseCodes: { type: 'array', items: { type: 'string' }, example: ['NDC', 'ROADMAP'] },
            createdAt: { type: 'string', format: 'date-time' },
            cycleWeeks: { type: 'array', items: { $ref: '#/components/schemas/CycleWeek' } },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            cycleId: { type: 'integer' },
            stationId: { type: 'integer' },
            shift: { type: 'string', enum: ['AM', 'PM'] },
            week: { type: 'integer', minimum: 1, maximum: 12 },
            traineeName: { type: 'string', example: 'John Doe' },
            contactId: { type: 'string', nullable: true },
            bookedAt: { type: 'string', format: 'date-time' },
          },
        },

        // --- Grid Types ---
        GridRow: {
          type: 'object',
          properties: {
            stationId: { type: 'integer' },
            station: { type: 'string', example: 'A-1' },
            labName: { type: 'string', example: 'Lab A' },
            side: { type: 'string', enum: ['LH', 'RH'] },
            availability: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of 12 strings — empty string = available, trainee name = booked',
            },
          },
        },
        WeekDate: {
          type: 'object',
          properties: {
            week: { type: 'integer' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        GridResult: {
          type: 'object',
          properties: {
            cycleId: { type: 'integer' },
            shift: { type: 'string', enum: ['AM', 'PM'] },
            labType: { type: 'string' },
            side: { type: 'string' },
            locked: { type: 'boolean' },
            weeks: { type: 'array', items: { type: 'integer' } },
            weekDates: { type: 'array', items: { $ref: '#/components/schemas/WeekDate' } },
            grid: { type: 'array', items: { $ref: '#/components/schemas/GridRow' } },
          },
        },

        // --- Booking Types ---
        AvailableBlock: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            stationId: { type: 'integer' },
            lab: { type: 'string' },
            station: { type: 'integer' },
            side: { type: 'string' },
            shift: { type: 'string', enum: ['AM', 'PM'] },
            weeks: { type: 'array', items: { type: 'integer' } },
          },
        },

        // --- Registration Types ---
        RegistrationRow: {
          type: 'object',
          properties: {
            seatNumber: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            studentId: { type: 'string' },
            courseStartDate: { type: 'string', format: 'date-time', nullable: true },
            courseEndDate: { type: 'string', format: 'date-time', nullable: true },
            registrationDate: { type: 'string', format: 'date-time', nullable: true },
            paymentStatus: { type: 'string' },
            outstanding: { type: 'number' },
            cycleCount: { type: 'integer' },
            hasRoadmap: { type: 'boolean' },
            hasAFK: { type: 'boolean' },
            hasACJ: { type: 'boolean' },
            examDate: { type: 'string', format: 'date-time', nullable: true },
            contactId: { type: 'string' },
            dealId: { type: 'string' },
          },
        },
        RegistrationMeta: {
          type: 'object',
          properties: {
            totalStudents: { type: 'integer' },
            shift: { type: 'string', enum: ['AM', 'PM'] },
            fetchedAt: { type: 'string', format: 'date-time' },
            noCodes: { type: 'boolean' },
          },
        },
        RegistrationResult: {
          type: 'object',
          properties: {
            rows: { type: 'array', items: { $ref: '#/components/schemas/RegistrationRow' } },
            meta: { $ref: '#/components/schemas/RegistrationMeta' },
          },
        },

        // --- Analytics Types ---
        OccupancyEntry: {
          type: 'object',
          properties: {
            week: { type: 'integer' },
            lab: { type: 'string' },
            shift: { type: 'string' },
            totalSlots: { type: 'integer' },
            booked: { type: 'integer' },
            percent: { type: 'number', format: 'float' },
          },
        },
        SeatingAnalyticsSummary: {
          type: 'object',
          properties: {
            totalSlots: { type: 'integer' },
            totalBooked: { type: 'integer' },
            overallPercent: { type: 'number', format: 'float' },
            numCycles: { type: 'integer' },
          },
        },
        SeatingAnalyticsResult: {
          type: 'object',
          properties: {
            weekOccupancy: {
              type: 'array',
              items: { $ref: '#/components/schemas/OccupancyEntry' },
            },
            labOccupancy: { type: 'array', items: { $ref: '#/components/schemas/OccupancyEntry' } },
            shiftOccupancy: {
              type: 'array',
              items: { $ref: '#/components/schemas/OccupancyEntry' },
            },
            summary: { $ref: '#/components/schemas/SeatingAnalyticsSummary' },
            bookingMatrix: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                additionalProperties: { type: 'integer' },
              },
              description: 'Lab name → week number → booked count',
            },
            labStationCounts: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              description: 'Lab name → total station count',
            },
          },
        },
        RegistrationWarning: {
          type: 'object',
          properties: {
            cycleId: { type: 'integer' },
            cycleName: { type: 'string' },
            shift: { type: 'string' },
            error: { type: 'string' },
          },
        },
        RegistrationAnalyticsResult: {
          type: 'object',
          properties: {
            totalStudents: { type: 'integer' },
            paymentDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            cycleCountDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cycleNumber: { type: 'integer' },
                  count: { type: 'integer' },
                },
              },
            },
            programCounts: {
              type: 'object',
              properties: {
                roadmap: { type: 'integer' },
                afk: { type: 'integer' },
                acj: { type: 'integer' },
              },
            },
            warnings: {
              type: 'array',
              items: { $ref: '#/components/schemas/RegistrationWarning' },
            },
          },
        },

        // --- Contact Types ---
        HubSpotDeal: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            properties: {
              type: 'object',
              properties: {
                dealname: { type: 'string' },
                amount: { type: 'string' },
                dealstage: { type: 'string' },
                remaining_amount: { type: 'string' },
                createdate: { type: 'string', format: 'date-time' },
              },
            },
            stageName: { type: 'string', description: 'Human-readable deal stage name' },
          },
        },
        NormalizedContact: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            studentId: { type: 'string' },
            qrCodeId: { type: 'string' },
            fullName: { type: 'string' },
            lifeCycleStage: { type: 'string' },
            paymentStatus: { type: 'string' },
            deals: { type: 'array', items: { $ref: '#/components/schemas/HubSpotDeal' } },
          },
        },

        // --- Response Envelopes ---
        SuccessResponse: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            count: { type: 'integer' },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object', nullable: true },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                authenticated: { type: 'boolean' },
              },
            },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            count: { type: 'integer' },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            message: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required — missing or invalid JWT cookie',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'Authentication required.' },
            },
          },
        },
        Forbidden: {
          description: 'Action not allowed (e.g., cycle is locked)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'Cycle is locked.' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'Cycle not found.' },
            },
          },
        },
        Conflict: {
          description: 'Resource conflict (e.g., slot already booked)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'Slot already booked.' },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'Validation failed.', details: { year: '"year" is required' } },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints (public)' },
      { name: 'Cycles', description: 'Cycle CRUD and lock management' },
      { name: 'Grid', description: 'Availability grid and CSV export' },
      { name: 'Bookings', description: 'Slot booking, unbooking, and block finder' },
      { name: 'Contacts', description: 'HubSpot CRM contact operations' },
      { name: 'Registration', description: 'Registration list from HubSpot data' },
      { name: 'Analytics', description: 'Seating and registration analytics' },
    ],
    security: [{ cookieAuth: [] }],
  },
  apis: [path.join(__dirname, 'routes', '*')],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
