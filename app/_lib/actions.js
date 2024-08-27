"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "./auth";
import { supabase } from "@/app/_lib/supabase";
import { getBookings } from "./data-service";

export async function singInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function UpdateGuest(formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!isValidAlphanumeric(nationalID)) {
    throw new Error("Please provide a valid national ID");
  }

  const updateData = {
    nationalID,
    countryFlag,
    nationality,
  };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Guest could not be updated");
  }

  revalidatePath("/account/profile");
}

function isValidAlphanumeric(str) {
  const regex = /^[a-zA-Z0-9]{6,12}$/;
  return regex.test(str);
}

export async function createBooking(bookingData, formData) {
  // console.log(formData, bookingData);

  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  // formData = Object.entries(formData.entries())

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  const { error } = await supabase
    .from("bookings")
    .insert([newBooking])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be created");
  }

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect('/cabins/thank-you')
}

export async function deleteBooking(bookingId) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((b) => b.id);

  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowd to delete this booking");
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }

  // For testing
  // await new Promise((res) => setTimeout(res, 2000));

  revalidatePath("/account/reservations");
}

export async function updateBooking(formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const bookingId = Number(formData.get("bookingId"));

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((b) => b.id);

  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowd to delete this booking");
  }

  const updatedFields = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  const { error } = await supabase
    .from("bookings")
    .update(updatedFields)
    .eq("id", bookingId)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }

  revalidatePath("/account/reservations");
  revalidatePath(`/account/reservations/edit/${bookingId}`);

  redirect("/account/reservations");
}
