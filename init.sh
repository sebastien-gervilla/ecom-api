#!/bin/sh

# Attendre que PostgreSQL soit prêt
./wait-for-it.sh postgres:5432 --timeout=30 --strict -- echo "Postgres is up and running"

# Définir les variables nécessaires pour la connexion à la base de données
DB_NAME=$DATABASE_NAME
DB_USER=$DATABASE_USER
DB_PASS=$DATABASE_PASS
DB_HOST=$DATABASE_HOST
DB_PORT=$DATABASE_PORT

# Vérifier si la base de données existe, et la créer si ce n'est pas le cas
echo "Checking if database $DB_NAME exists..."
RESULT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")

if [ "$RESULT" = "1" ]; then
    echo "Database $DB_NAME already exists."
else
    echo "Database $DB_NAME does not exist. Creating..."
    PGPASSWORD=$DB_PASS createdb -h $DB_HOST -U $DB_USER $DB_NAME
    echo "Database $DB_NAME created successfully."
fi

# Appliquer les migrations si elles n'ont pas été faites
MIGRATION_FLAG_FILE="/usr/src/order-service/.migration_completed"

if [ ! -f "$MIGRATION_FLAG_FILE" ]; then
    echo "Applying database migrations..."
    npm run migration:up

    # Insérer l'utilisateur admin après les migrations
    echo "Creating admin user..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
    INSERT INTO public.\"user_entity\"(
        first_name, 
        last_name, 
        email, 
        password, 
        role, 
        created_at, 
        updated_at
    ) VALUES (
        'admin',
        'admin',
        'admin@gmail.com', 
        '\$2b\$10\$IkDv2U4Mwkd4eIAW0AmsJuX/yuPr9cEH78Ybr/IhBqw4nr0H5k8su',
        'administrator', 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO NOTHING;"

    # Marquer les migrations comme terminées
    touch "$MIGRATION_FLAG_FILE"
    echo "Migrations and admin user creation completed."
else
    echo "Migrations have already been applied."
fi

# Lancer l'application après la création de la base de données et les migrations
echo "Starting the user service..."
npm start
