import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: {
                translation: {
                    Cancel: "Annuler",
                    Create: "Créer",
                    Add: "Ajouter",
                    Update: "Modifier",
                    Edit: "Modifier",
                    Delete: "Supprimer",
                    View: "Voir",
                    Hide: "Cacher",
                    Select: "Sélectionner",
                    Search: "Rechercher",

                    None: "Aucun",
                    NoneF: "Aucune",

                    FirstName: "Prénom",
                    LastName: "Nom",
                    Name: "Nom",
                    Description: "Description",
                    Phone: "Téléphone",
                    Gender: "Genre",
                    Man: "Masculin",
                    Woman: "Féminin",
                    member: "membre",
                    Member: "Membre",
                    members: "membres",
                    Members: "Membres",
                    category: "catégorie",
                    Category: "Catégorie",
                    Categories: "Catégories",
                    user: "utilisateur",
                    User: "Utilisateur",
                    users: "utilisateurs",
                    Users: "Utilisateurs",
                    event: "évenement",
                    Event: "Evenement",
                    events: "évenements",
                    Events: "Evenements",
                    Email: "Adresse email",
                }
            }
        },
        lng: "fr",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;