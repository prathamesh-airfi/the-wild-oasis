import UpdateReservationForm from "@/app/_components/UpdateReservationForm";
import { updateBooking } from "@/app/_lib/actions";
import { getBooking, getCabin, getSettings } from "@/app/_lib/data-service";

export default async function Page({ params: { reservationId } }) {
  const { cabinId, numGuests, observations } = await getBooking(reservationId);
  const { maxCapacity } = await getCabin(cabinId);

  return (
    <div>
      <h2 className="font-semibold text-2xl text-accent-400 mb-7">
        Edit Reservation #{reservationId}
      </h2>

      <UpdateReservationForm numGuests={numGuests} observations={observations} maxCapacity={maxCapacity} reservationId={reservationId} />
    </div>
  );
}
