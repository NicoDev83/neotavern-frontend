import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import CardEvent from "../components/CardEvent";
import HeaderSearch from "../components/SearchHeader";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { getAllEvents, getLikedEvents, likeAnEvent } from "../fetchers/events";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../styleConstants/colors";
import TextApp from "../styleComponents/TextApp";

const MapScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user.value);
  const token = user.user.token;
  const userId = user.user.id;

  const types = [
    { label: "Concert" },
    { label: "Soirée" },
    { label: "Exposition" },
    { label: "Conférence" },
    { label: "Atelier" },
    { label: "Festival" },
    { label: "Spectacle" },
    { label: "Cinéma" },
    { label: "Théâtre" },
    { label: "Sport" },
    { label: "Jeux" },
  ];

  const [likedEvents, setLikedEvents] = useState([]);
  const bottomSheetRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [allEvents, setAllEvents] = useState(null);
  const [selectedType, setSelectedType] = useState([]);

  const snapPoints = ["20%", "68%"];

  //drawer
  const openPanel = () => {
    bottomSheetRef.current?.expand();
  };

  //map
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  //events
  const fetchEvents = async () => {
    try {
      const events = await getAllEvents();
      setAllEvents(events);
      // console.log(allEvents);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLikedEvents = async () => {
    try {
      const response = await getLikedEvents(token);
      setLikedEvents(response.likedEvents.map((event) => event._id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async (eventId) => {
    try {
      await likeAnEvent(token, eventId);
      fetchEvents();
      fetchLikedEvents();
    } catch (error) {
      console.error(error);
    }
  };

  // Date filter

  const [activeDateFilter, setActiveDateFilter] = useState(null); // Nouvel état pour suivre le filtre actif

  const handleEventDate = async (dateFilter) => {
    try {
      if (!dateFilter) {
        // Si le filtre est désactivé, réafficher tous les événements
        await fetchEvents();
        return;
      }

      // Récupérer tous les événements pour appliquer le filtre
      const events = await getAllEvents();

      const now = new Date();
      let filteredEvents = [];

      if (dateFilter === "today") {
        filteredEvents = events.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === now.toDateString();
        });
      } else if (dateFilter === "week") {
        const weekEndDate = new Date();
        weekEndDate.setDate(now.getDate() + (7 - now.getDay()));

        filteredEvents = events.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= weekEndDate;
        });
      } else if (dateFilter === "weekend") {
        const weekendStart = new Date();
        const weekendEnd = new Date();
        weekendStart.setDate(now.getDate() + (6 - now.getDay()));
        weekendEnd.setDate(now.getDate() + (7 - now.getDay()));

        filteredEvents = events.filter((event) => {
          const eventDate = new Date(event.date);
          return (
            eventDate.toDateString() === weekendStart.toDateString() ||
            eventDate.toDateString() === weekendEnd.toDateString()
          );
        });
      }

      setAllEvents(filteredEvents);
      openPanel(); // Ouvre le panneau des résultats après le filtrage
    } catch (error) {
      console.error("Erreur lors du filtrage des événements :", error);
    }
  };

  const handleEventType = (type) => {
    if (selectedType.includes(type)) {
      setSelectedType(
        selectedType.filter((item) => item.toLowerCase() !== type.toLowerCase())
      );
      const filteredEvents = [...allEvents].filter((event) =>
        event.categories.find((category) => category === type)
      );
      openPanel();
      setAllEvents(filteredEvents);
    } else {
      setSelectedType([...selectedType, type]);
      const filteredEvents = [...allEvents].filter((event) =>
        event.categories.find((category) => category === type)
      );
      openPanel();
      setAllEvents(filteredEvents);
    }
  };

  const handleReset = () => {
    setSelectedType([]);
    fetchEvents();
    openPanel();
  };

  // Search
  // Selection de l'établissement dans la barre de recherche (récuperation de l'ID)
  const handleSelectPlace = (placeId) => {
    const filteredEvents = [...allEvents].filter(
      (event) => event.place._id === placeId
    );
    setAllEvents(filteredEvents);
  };

  useEffect(() => {
    if (selectedType.length === 0) {
      fetchEvents();
    }
  }, [selectedType]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchLikedEvents();
      openPanel();
    }, [])
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        setUserLocationEnabled={true}
        showsUserLocation={true}
        initialRegion={region}
      >
        {allEvents &&
          allEvents.map((event) => (
            <Marker
              key={event._id}
              coordinate={{
                latitude: event.place.latitude,
                longitude: event.place.longitude,
              }}
              title={event.name}
              description={event.place.name}
            />
          ))}
      </MapView>

      <SafeAreaView style={styles.searchbar}>
        <HeaderSearch
          onSelectPlace={handleSelectPlace}
          onReset={handleReset}
          handleEventDate={handleEventDate}
          onFilterDate={handleEventDate}
        />
      </SafeAreaView>

      <SafeAreaView style={styles.filters}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={
              selectedType.length === 0
                ? { ...styles.filterTag, backgroundColor: colors.darkGreen }
                : styles.filterTag
            }
            onPress={() => handleReset()}
          >
            <Text style={styles.filterText}>Tous</Text>
          </TouchableOpacity>
          {types.map((type, index) => (
            <TouchableOpacity
              key={index}
              style={
                selectedType.includes(type.label)
                  ? { ...styles.filterTag, backgroundColor: colors.darkGreen }
                  : styles.filterTag
              }
            >
              <Text
                style={styles.filterText}
                onPress={() => handleEventType(type.label)}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        style={styles.drawer}
        enableDynamicSizing={false}
      >
        <BottomSheetScrollView style={styles.scrollContainer}>
          {allEvents && allEvents.length > 0 ? (
            allEvents
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((event) => (
                <CardEvent
                  key={event._id}
                  event={event}
                  navigation={navigation}
                  handleLike={handleLike}
                  isLiked={likedEvents.includes(event._id)}
                />
              ))
          ) : (
            <TextApp>Aucun événement trouvé</TextApp>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#6200EE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  contentContainer: {
    position: "relative",
  },

  scrollContainer: {
    width: "100%",
  },

  drawer: {
    paddingHorizontal: 20,
  },

  searchbar: {
    paddingHorizontal: 12,
    top: "6%",
    width: "100%",
  },

  filters: {
    top: "8%",
    width: "100%",

    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },

  filterTag: {
    borderWidth: 1,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: colors.light,
    borderColor: colors.dark,
    borderWidth: 1,
    borderRadius: 15,
    marginStart: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
});

export default MapScreen;
