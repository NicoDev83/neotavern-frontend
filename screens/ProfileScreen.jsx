import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { getAllEvents } from "../fetchers/events";
import CardEventProfil from "../components/CardEventProfil";

import TextApp from "../styleComponents/TextApp";
import TextAppTitle from "../styleComponents/TextAppTitle";
import colors from "../styleConstants/colors";

const ProfileScreen = ({ navigation }) => {
  // userEvents contient les événéments créés seulement par l'utilisateur
  const [userEvents, setUserEvents] = useState([]);
  // isLoading pour charger les événements créés par l'utilisateur
  const [isLoading, setIsLoading] = useState(true);

  // import des données utilisateurs depuis le reducer
  const user = useSelector((state) => state.user.value);
  const nickname = user.user.nickname;
  const email = user.user.email;
  const token = user.user.token;

  // Simuler un chargement avec un délai de 1,5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer); // Nettoyer le timer
  }, []);

  // importe tous les événements de la base de donnée et tri ceux qui sont créés par l'utilisateur (avec son token)
    // ajout d'un try catch pour la gestion des erreurs
  const fetchEvents = async () => {
    try {
      const events = await getAllEvents();
      if (user) {
        // Vérifie si 'user' n'est pas nul
        const myEvents = events.filter(
          (event) => event.user && event.user.token === token
        );
        setUserEvents(myEvents); // ajoute les événéments créés par l'utilisateur dans l'état userEvents
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Actualisation du fetch quand l'utilisateur change de screen
    // useCallBack memorise le fetch pour éviter qu'il soit re-render à chaque rendu
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  // Supprime un événement créé par l'utilisateur (identifié par son token) grâce au fetch de la route Delete (events) en back
  const handleDeleteEvent = (eventId) => {
    fetch(`https://neotavern-backend.vercel.app/events/deleteEvent/${token}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
      }),
    })
      .then((response) => response.json()) // Conversion de la réponse en JSON
      .then((data) => {
        console.log("Tâche supprimée avec succès :", data);
        fetchEvents();
      })
      .catch((error) => {
        console.error("Erreur:", error);
      });
  };

  // Supprime le compte de l'utilisateur (identifié par son token) grâce au fetch de la route Delete (users) en back
  const handleDeleteUser = (token) => {
    fetch(`https://neotavern-backend.vercel.app/users/deleteUser/${token}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((response) => response.json()) // Conversion de la réponse en JSON
      .then((data) => {
        console.log("Utilisateur supprimé avec succès :", data);
        navigation.navigate("Welcome");
      })
      .catch((error) => {
        console.error("Erreur:", error);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.mainTitle}>Profil</Text>
      <View style={styles.blockInfo}>
        <TextAppTitle>Mes informations</TextAppTitle>
        <View style={styles.userInfo}>
          <TextApp>Surnom: {nickname}</TextApp>
          <TextApp>Email: {email}</TextApp>
        </View>
      </View>
      <View style={styles.events}>
        <TextAppTitle>Mes événements créés</TextAppTitle>

        {/* Ajout d'un loader de 1,5 sec pour montrer que les événéments que l'on a créé se charges */}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.dark} />
          </View>
        ) : (
          <ScrollView style={styles.scrollWrapper}>
            <View style={styles.eventContent}>
              <TextApp>Gérez vos évènements créés ici !</TextApp>

              {/* Ajout (map) et Tri (sort) des événéments créés par l'utilisateur par ordre de création (nouveaux en premier) */}

              {userEvents &&
                userEvents
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((event) => (
                    <View key={event._id} style={styles.card}>
                      <CardEventProfil
                        key={event._id}
                        event={event}
                        navigation={navigation}
                        handleDeleteEvent={handleDeleteEvent}
                      />
                    </View>
                  ))}

            </View>
          </ScrollView>
        )}
        <TouchableOpacity
          style={styles.buttonDelete}
          onPress={() => handleDeleteUser(token)}
        >
          <TextApp>Supprimer mon compte</TextApp>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    color: colors.dark,
    width: "100%",
    paddingRight: 28,
    paddingLeft: 28,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Lexend_500Medium",
    paddingTop: 60,
    paddingBottom: 20,
    width: "100%",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
    color: colors.dark,
  },
  blockInfo: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    marginTop: 28,
    padding: 28,
    borderWidth: 0.3,
    borderRadius: 15,
  },
  userInfo: {
    paddingTop: 12,
  },
  scrollWrapper: {
    minWidth: "100%",
    marginVertical: 28,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  events: {
    paddingTop: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 30,
    margin: 10,
    borderRadius: 8,
  },
  buttonDelete: {
    marginTop: 10,
    marginLeft: 20,
    padding: 12,
    borderRadius: 15,
    backgroundColor: colors.red,
  },
  buttonReset: {
    flex: 1,
    marginTop: 10,
    marginLeft: 20,
    padding: 12,
    borderRadius: 15,
    backgroundColor: colors.green,
  },
  eventContent: {
    borderRadius: 15,
    width: "100%",

    alignItems: "center",
    borderWidth: 0.3,
    borderColor: colors.dark,

    padding: 12,
  },
});

export default ProfileScreen;
