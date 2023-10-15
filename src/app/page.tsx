import FoodList from "./FoodList";

export default function Home() {
  return (
    <>
      <table className="table table-bordered md:w-1/2">
        <thead className="text-xl text-white">
          <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <FoodList />
        </tbody>
      </table>
    </>
  );
}
